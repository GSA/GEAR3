package main

import (
	"context"
	"encoding/json"
	"fmt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"log"
	"net/http"
	"os"
)

var clientSecretData []byte
var scopes []string
var err error

// init is called before main
func init() {
	// Read the client secret file
	clientSecretData, err = os.ReadFile("gear_google_credentials.json")
	if err != nil {
		log.Printf("Unable to read client secret file: %v", err)
		panic(err)
	}

	// Add the scopes for the Gmail API
	scopes = append(scopes, "https://www.googleapis.com/auth/spreadsheets.readonly")
}

func main() {
	if args := os.Args; len(args) > 1 {
		log.Println("Manual save token mode")
		if args[1] == "saveToken" {
			ManualSaveToken()
			os.Exit(0)
		}
	}
	//Start the server
	http.HandleFunc("/", BeginAuth)
	http.HandleFunc("/saveToken", SaveToken)
	http.ListenAndServe(":4201", nil)
	log.Println("Listening on port 4201...")
}

// BeginAuth begins the authorization process
func BeginAuth(w http.ResponseWriter, r *http.Request) {
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

	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, html)
}

// SaveToken saves the token to a file
func SaveToken(w http.ResponseWriter, r *http.Request) {
	// Get the config from the client secret data
	log.Println("Obtaining config from client secret data...")
	config, err := google.ConfigFromJSON(clientSecretData, scopes...)
	if err != nil {
		log.Fatalf("Unable to parse client secret file to config: %v", err)
	}

	// Get the token from the user
	log.Println("Getting token from user...")
	token, err := config.Exchange(context.Background(), r.URL.Query().Get("code"))
	if err != nil {
		log.Fatalf("Unable to retrieve token from web: %v", err)
	}

	// Marshal the token to JSON
	tokenData, err := json.Marshal(token)
	if err != nil {
		log.Fatalf("Unable to marshal token to JSON %v", err)
	}

	// Write the token to a file
	tokenName := "token.json"
	err = os.WriteFile(tokenName, tokenData, 0644)
	if err != nil {
		log.Fatalf("Unable to write token to file %v", err)
	}

	log.Printf("Token saved at %s", tokenName)
	os.Exit(0)
}

func ManualSaveToken(){
	log.Println("Obtaining config from client secret data...")
	config, err := google.ConfigFromJSON(clientSecretData, scopes...)
	if err != nil {
		log.Fatalf("Unable to parse client secret file to config: %v", err)
	}

	fmt.Println("Paste response url here:")

	// Use fmt.Scan() to read from stdin instead of bufio.NewReader(os.Stdin).ReadString('\n')
	var authCode string
	// Read the auth code from the command-lin

	if _, err := fmt.Scan(&authCode); err != nil {
		log.Fatalf("Unable to read authorization code %v", err)
	}

	// Exchange the auth code for a token
	token, err := config.Exchange(context.Background(), authCode)
	if err != nil {
		log.Fatalf("Unable to retrieve token from web %v", err)
	}

	// Marshal the token to JSON
	tokenData, err := json.Marshal(token)
	if err != nil {
		log.Fatalf("Unable to marshal token to JSON %v", err)
	}

	// Write the token to a file
	tokenName := "token.json"
	err = os.WriteFile(tokenName, tokenData, 0644)
	if err != nil {
		log.Fatalf("Unable to write token to file %v", err)
	}

	log.Printf("Token saved at %s", tokenName)
	os.Exit(0)
}