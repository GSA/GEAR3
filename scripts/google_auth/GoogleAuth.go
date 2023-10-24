package main

import (
	"context"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var scopes = []string{"https://www.googleapis.com/auth/spreadsheets.readonly"}
var err error
var clientSecretData []byte
var CONFIG *oauth2.Config

// init is called before main
func init() {
	// Read the client secret file
	clientSecretData, err = os.ReadFile("gear_google_credentials.json")
	if err != nil {
		log.Printf("Unable to read client secret file: %v", err)
		panic(err)
	}

	// Get the config from the client secret data
	log.Println("Obtaining config from client secret data...")
	CONFIG, err = google.ConfigFromJSON(clientSecretData, scopes...)
	if err != nil {
		log.Fatalf("Unable to parse client secret file to config: %v", err)
	}
}

func main() {
	//Start the server
	router := gin.Default()
	CORS := cors.DefaultConfig()
	CORS.AllowHeaders = []string{"*"} //Allows all headers for things like htmx's hx-get, hx-target, etc
	CORS.AllowAllOrigins = true
	router.Use(cors.New(CORS))

	router.LoadHTMLGlob("*.html")
	router.GET("/", indexPage)
	router.GET("/beginAuth", BeginAuth)
	router.POST("/getToken", GetToken)

	router.Run(":4201")
	log.Println("Listening on port 4201...")
}

func indexPage(c *gin.Context) {
	// Define the data to be injected into the template

	// Parse the HTML template file
	tmpl, err := template.ParseFiles("index.html") // Use "template.html" here
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Execute the template with the data
	c.HTML(http.StatusOK, tmpl.Name(), struct {
		ClientID string
	}{
		ClientID: CONFIG.ClientID,
	}) // Use "template.html" here as well
}

// BeginAuth begins the authorization process
func BeginAuth(c *gin.Context) {
	// Get the config from the client secret data
	log.Println("Obtaining config from client secret data...")
	config, err := google.ConfigFromJSON(clientSecretData, scopes...)
	if err != nil {
		log.Fatalf("Unable to parse client secret file to config: %v", err)
	}

	// Get the token from the user
	authURL := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	log.Println("Opening browser to obtain token...")
	html := `
	<!DOCTYPE html>
	<html>
	<head>
		<title>Open URL</title>
		<script>
      window.location.href = "` + authURL + `";
		</script>
	</head>
	</html>
	`

	c.Writer.WriteHeader(http.StatusOK)
	c.Writer.Header().Set("Content-Type", "text/html")
	fmt.Fprint(c.Writer, html)
}

// GetToken saves the token to a file
func GetToken(c *gin.Context) {

	// Parse the URL
	parsedURL, err := url.Parse(c.PostForm("token_string"))
	if err != nil {
		fmt.Println("Error parsing URL:", err)
		return
	}

	// Get the "code" query parameter
	code := parsedURL.Query().Get("code")

	// Get the token from the user
	log.Println("Getting token from user...")
	token, err := CONFIG.Exchange(context.Background(), code)
	if err != nil {
		log.Println(err.Error())
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, token)

}
