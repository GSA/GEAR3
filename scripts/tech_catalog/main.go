package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"database/sql"
	_ "embed"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"github.com/go-sql-driver/mysql"
	_ "github.com/go-sql-driver/mysql"
	"io"
	"log"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"sync"
	"time"
)

var mainTimer = time.Now()
var Config = &Configuration{}
var MaxRoutines = 1000
var CTX = context.Background()
var Db = &sql.DB{}

func init() {
	if len(os.Args) > 1 && os.Args[1] == "generate_config" {
		NewConfig()
		os.Exit(0)
	}
	configPath := flag.String("config", "config.json", "The path to the config.json file")
	flag.Parse()

	Config = LoadConfig(*configPath)
	Db = InitMySQL(
		Config.Database.Username,
		Config.Database.Password,
		Config.Database.Host,
		Config.Database.Port,
		Config.Database.Name,
		Config.Database.Options,
		Config.Database.Auth)
}

func main() {
	defer Db.Close()
	//Create a new logger
	{
		if _, err := os.Stat("logs"); errors.Is(err, os.ErrNotExist) {
			err := os.Mkdir("logs", os.ModePerm)
			if err != nil {
				log.Println(err.Error())
				panic(err)
			}
		}
		logFileName := fmt.Sprintf("%s--%s.log", time.Now().Format("2006-01-02"),
			filepath.Base(strings.ReplaceAll(os.Args[0], ".exe", "")))
		logFile, err := os.OpenFile("logs"+string(os.PathSeparator)+logFileName, os.O_RDWR|os.O_CREATE|os.O_APPEND, os.ModePerm)
		if err != nil {
			log.Println(err.Error())
			return
		}
		defer func() {
			err := logFile.Close()
			if err != nil {
				log.Println(err.Error())
				return
			}
		}()
		mw := io.MultiWriter(os.Stdout, logFile)
		log.SetOutput(mw)
	}
	queries := Config.Queries
	log.Printf("Url: %s", Config.TechnopediaURl)
	log.Printf("Refresh Token: %s", Config.RefreshToken)
	log.Printf("Total number of Queries: %d", len(queries))

	// Get access token for Technopedia
	accessKey, err := GetAccessKey(Config.RefreshToken)
	if err != nil {
		fmt.Println(err)
	}

	wg := &sync.WaitGroup{}
	wg.Add(len(queries))
	log.Printf("Executing GraphQL requests...")

	// Execute all Queries ---------------------------------------------
	for technopediaObject, query := range queries {
		go Execute(technopediaObject, query.(string), accessKey, wg)

	} // end for
	wg.Wait()

	log.Printf("Finished executing all Queries in %s\n", time.Since(mainTimer))
}

func Execute(technopediaObject, rootQuery, accessKey string, wg *sync.WaitGroup) {
	timer := time.Now()
	log.Printf(`*******Executing GraphQL "%s" Queries*****`, technopediaObject)

	// Set up the GraphQL request
	technopediaRequest := Request{
		URL:          Config.TechnopediaURl,
		GraphQLQuery: rootQuery,
	}
	technopediaRequest.AddHeader("Authorization", "Bearer "+accessKey)

	// Iterate through the datasets until there are no more datasets to retrieve using the lastId
	totalInserts := 0

	for lastId := ""; ; {
		// Execute the GraphQL request
		res, err := technopediaRequest.Do()
		if err != nil { // If there is an error, then log the error and continue to the next dataset
			log.Printf("Error: %v", err)
			panic(err)
		} else if v, ok := res["errors"]; ok {
			log.Printf("Error: %v", v)
			panic(fmt.Errorf("error: %v", v))
		}

		// If the response dataset is empty, then there are no more datasets to retrieve
		if res["data"] == nil {
			log.Printf(`Empty dataset from "%s" @ [%s]`, technopediaObject, lastId)
			continue
		}

		// If the current dataset is empty, then there are no more datasets to retrieve
		var responseDataSet = res["data"].(map[string]any)[technopediaObject].([]any)
		if len(responseDataSet) <= 0 {
			log.Printf(`No more datasets to retrieve from "%s" past [%s]`, technopediaObject, lastId)
			break
		}

		totalInserts += len(responseDataSet)
		totalJobs := len(responseDataSet)
		jobsToWork := responseDataSet
		totalBatches := (totalJobs / MaxRoutines) + 1
		batchCounter := 1
		for {
			batchTimer := time.Now()
			log.Printf("<----- [%s]: Batchset [%d] of [%d] ----->\n", technopediaObject, batchCounter, totalBatches-1)
			if len(jobsToWork) < MaxRoutines {
				MaxRoutines = len(jobsToWork)
			}

			nestedWG := &sync.WaitGroup{}
			nestedWG.Add(MaxRoutines)

			for _, job := range jobsToWork[:MaxRoutines] {
				go func(data any) {
					defer nestedWG.Done()
					statementMap := GetInsertStatement(technopediaObject, data) //TODO: handle multiple
					err = InsertIntoTable(technopediaObject, statementMap)

					if err != nil {
						log.Printf("Error inserting into table: %v", err)
						panic(err)
					}
				}(job)
			}
			nestedWG.Wait()

			jobsToWork = jobsToWork[MaxRoutines:]
			if len(jobsToWork) == 0 {
				break
			}
			batchCounter++
			log.Printf("Batch took %s\n", time.Since(batchTimer))
		}

		// Get the number of datasets thus far
		log.Printf("%s Objects thus far: %d", technopediaObject, totalInserts)

		// Update the GraphQL query with the lastId
		technopediaRequest.GraphQLQuery = strings.ReplaceAll(technopediaRequest.GraphQLQuery, ", afterId: \""+lastId+"\"", "")
		lastId = responseDataSet[len(responseDataSet)-1].(map[string]any)["id"].(string)
		technopediaRequest.GraphQLQuery = strings.Replace(technopediaRequest.GraphQLQuery, ")", ", afterId: \""+lastId+"\")", 1)
	} // end for loop

	log.Printf("Finished executing \"%s\" Queries in %s\n", technopediaObject, time.Since(timer))
	wg.Done()
}

// ModelDataset models the dataset into a map
func ModelDataset(modelName string, dataset any) map[string]any {
	// Convert the dataset into bytes
	dataByte, err := json.Marshal(dataset)
	if err != nil {
		log.Println(err.Error())
		panic(err)
	}

	var modelData []byte

	switch modelName {
	case "SoftwareProduct":
		sp := &SoftwareProduct{}
		err = json.Unmarshal(dataByte, sp)
		if err != nil {
			log.Println(err.Error())
			panic(err)
		}
		// Convert the object into bytes to model the map
		modelData, err = json.Marshal(sp)
		break
	case "Taxonomy":
		taxonomy := &Taxonomy{}
		err = json.Unmarshal(dataByte, taxonomy)
		if err != nil {
			log.Println(err.Error())
			panic(err)
		}
		// Convert the object into bytes to model the map
		modelData, err = json.Marshal(taxonomy)
		break
	}
	if err != nil {
		log.Println(err.Error())
		panic(err)
	}
	// Convert the modeled bytes into a map
	modelMap := make(map[string]any)
	err = json.Unmarshal(modelData, &modelMap)
	if err != nil {
		log.Println(err.Error())
		panic(err)
	}
	return modelMap
}

// GetInsertStatement gets the insert statement for the current dataset
func GetInsertStatement(technopediaObject string, data any) map[string]any {
	insertMap := make(map[string]any)
	// Iterate through the current data
	// Model the data
	modelMap := ModelDataset(technopediaObject, data)
	// Iterate through the modeled map
	for tableRow, rowValue := range modelMap {
		// If the rowValue is not nil, then check if it is a map
		if rowValue != nil {
			if strings.Contains(reflect.TypeOf(rowValue).String(), "map") {
				// If the rowValue is a map, then convert it to a string
				rowValue = rowValue.(map[string]any)["id"].(string)
			} else if strings.Contains(tableRow, "Date") || strings.Contains(tableRow, "toBe") {
				if rowValue != "" {
					// If the rowValue is a date, then convert it to a string
					t, err := time.Parse(time.RFC3339, rowValue.(string))
					if err != nil {
						log.Println(err.Error())
						panic(err)
					}
					rowValue = t.Format("2006-01-02 15:04:05") // Replace the format with your database's expected format
				} else {
					rowValue = nil
				}
			}
		}
		insertMap[tableRow] = rowValue
	}
	return insertMap
}

// InsertIntoTable inserts the data into the table
func InsertIntoTable(technopediaObject string, insertMap map[string]any) error {
	var insertColumns []string
	var insertValues []any
	for s, a := range insertMap {
		insertColumns = append(insertColumns, s)
		insertValues = append(insertValues, a)
	}

	statement := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)",
		Config.Database.Name+".tp_"+technopediaObject,
		strings.Join(insertColumns, ","),
		strings.Repeat("?,", len(insertColumns)-1)+"?")
	stmt, err := Db.Prepare(statement)
	defer stmt.Close()
	if err != nil {
		fmt.Println(err)
		return err
	}

	_, err = stmt.Exec(insertValues...)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			return nil
		}
		fmt.Println(err)
		return err
	}
	return nil
}

// InitMySQL initializes the mysql connection
func InitMySQL(dbUser, dbPass, dbHost, port, dbName string, options, auth map[string]string) *sql.DB {
	if port != "" {
		port = ":" + port
	}
	if dbName != "" {
		dbName = "/" + dbName
	}
	connection := fmt.Sprintf("%s:%s@tcp(%s%s)%s", dbUser, dbPass, dbHost, port, dbName)
	if len(options) > 0 {
		connection += "?"
		for k, v := range options {
			connection += k + "=" + v + "&"
		}
		connection = connection[:len(connection)-1]
	}
	log.Printf("Connecting to database: %s\n", connection)

	db, err := sql.Open("mysql", connection)
	if err != nil {
		log.Fatalf("failed to connect: %v", err)
	}

	if err := db.Ping(); err != nil {
		log.Println("Failed to ping database, trying again in as secured connection...", err.Error())
		return InitSecureMySQL(auth["ca"], auth["key"], auth["cert"], Config)
	}

	log.Println("Successfully connected to database!")
	return db
}

// InitSecureMySQL initializes a secure MySQL connection
func InitSecureMySQL(caCertPath, clientKeyPath, clientCertPath string, configuration *Configuration) *sql.DB {
	log.Println("Initializing secure MySQL connection...")

	// Read the CA certificate and client certificate and key from disk.
	caCert, err := os.ReadFile(caCertPath)
	if err != nil {
		log.Fatal("Failed to read CA certificate:", err)
	} else {
		log.Println("CA certificate read successfully!")
	}

	// Load the client certificates from disk
	clientKey, err := os.ReadFile(clientKeyPath)
	if err != nil {
		log.Fatal("Failed to read client key:", err)
	} else {
		log.Println("Client key read successfully!")
	}

	// Load the client certificates from disk
	clientCert, err := os.ReadFile(clientCertPath)
	if err != nil {
		log.Fatal("Failed to read client certificate:", err)
	} else {
		log.Println("Client certificate read successfully!")
	}

	if configuration.Database.Port != "" {
		configuration.Database.Port = ":" + configuration.Database.Port
	}
	// Configure the MySQL connection parameters
	mysqlConfig := mysql.Config{
		User:      configuration.Database.Username,
		Passwd:    configuration.Database.Password,
		Net:       "tcp",
		Addr:      configuration.Database.Host + configuration.Database.Port,
		DBName:    configuration.Database.Name,
		TLSConfig: "custom",
	}
	log.Println("MySQL connection parameters configured...", mysqlConfig)

	tlsConfig := &tls.Config{
		RootCAs: x509.NewCertPool(),
		Certificates: []tls.Certificate{{
			Certificate: [][]byte{clientCert},
			PrivateKey:  clientKey,
		}},
	}

	// Append the CA certificate to the root CAs
	if ok := tlsConfig.RootCAs.AppendCertsFromPEM(caCert); !ok {
		log.Fatal("Failed to append CA certificate")
	}

	// Register the TLS config with the MySQL driver
	mysql.RegisterTLSConfig("custom", tlsConfig)

	// Open a connection to the MySQL server
	db, err := sql.Open("mysql", mysqlConfig.FormatDSN())
	if err != nil {
		log.Fatal("Failed to connect to the database:", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		log.Fatal("Failed to establish TLS connection:", err)
	}
	return db
}

// GetAccessKey gets the access_key from technopedia
func GetAccessKey(refreshToken string) (string, error) {
	log.Printf("Getting new access_key key from technopedia...")
	request := Request{
		Method: "POST",
		URL:    "https://login.flexera.com/oidc/token",
	}
	request.AddPayload("grant_type", "refresh_token")
	request.AddPayload("refresh_token", refreshToken)
	request.AddHeader("Content-Type", "application/x-www-form-urlencoded")
	res, err := request.Do()
	if err != nil {
		fmt.Println(err)
		return "", err
	}
	log.Printf("Received new access_key!!!")
	return res["access_token"].(string), nil
}

// A Configuration is a struct that holds the configuration for the application
type Configuration struct {
	RefreshToken string `json:"refresh_token"`
	Database     struct {
		Username string            `json:"username"`
		Password string            `json:"password"`
		Host     string            `json:"host"`
		Port     string            `json:"port"`
		Name     string            `json:"database_name"`
		Options  map[string]string `json:"options"`
		Auth     map[string]string `json:"auth"`
	} `json:"database"`
	TechnopediaURl string         `json:"technopedia_url"`
	Queries        map[string]any `json:"queries"`
}

// NewConfig creates a new configuration file
func NewConfig() {
	configBinary, err := json.Marshal(&Configuration{})
	if err != nil {
		log.Println("Error creating new configuration: " + err.Error())
		panic(err)
	}
	m := make(map[string]any)
	err = json.Unmarshal(configBinary, &m)
	if err != nil {
		log.Println("Error creating new configuration: " + err.Error())
		panic(err)
	}

	// Create the config file
	_, err = os.Create("new_config.json")
	if err != nil {
		log.Println("Error creating new configuration: " + err.Error())
		panic(err)
	}
	os.WriteFile("new_config.json", configBinary, 0777)
	log.Println("Created new configuration file: new_config.json")
}

// LoadConfig loads the configuration file
func LoadConfig(configPath string) *Configuration {
	configFile, err := os.Open(configPath)
	if err != nil {
		log.Println("Error loading configuration: " + err.Error())
		panic(err)
	}
	defer configFile.Close()

	config := &Configuration{}
	jsonParser := json.NewDecoder(configFile)
	err = jsonParser.Decode(config)
	return config
}
