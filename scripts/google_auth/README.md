# Go OAuth2 for Google Spreadsheets

This application demonstrates how to integrate OAuth2 for Google services, specifically for Google Spreadsheets, using the Gin web framework.

## Dependencies:

- `gin-gonic/gin`: The Gin web framework for building web applications.
- `gin-contrib/cors`: Middleware to handle Cross-Origin Resource Sharing in Gin.
- `golang.org/x/oauth2` and `golang.org/x/oauth2/google`: Libraries for integrating OAuth2 and specifically the Google authentication flow.

## Structure:

- **Initialization (`init` function)**:
  - Reads the `gear_google_credentials.json` containing client secret data for OAuth2.
  - Sets up the OAuth2 configuration using the client secret.

- **Main (`main` function)**:
  - Sets up routes and middleware.
  - Starts the server listening on port `4201`.

## Endpoints:

1. **`GET /`**:
   - Loads the `index.html` template and injects the OAuth2 Client ID.

2. **`GET /beginAuth`**:
   - Begins the OAuth2 authentication process by redirecting the user to Google's authentication page.

3. **`POST /getToken`**:
   - Accepts the token string from the client.
   - Exchanges the received code for an authentication token.
   - Sends back the token as a JSON response.

## Configuration:

Ensure you have a `gear_google_credentials.json` file in your root directory which contains your Google client secret data.

## Usage:

Run the application and navigate to `http://localhost:4201/` to begin the OAuth2 authentication process.



### Getting Started:


1. **Start Authentication**:
   - On the main page, click on the "Begin OAuth Flow" link.
   
3. **Google Authentication**:
   - You'll be redirected to Google's authentication page. If you're not already logged in to a Google account, you'll be prompted to do so.
   - After logging in, Google will ask for permissions to access your Google Sheets data. Review the permissions and click "Allow" if you're okay with the requested access.

4. **Receive Token**:
   - After granting permissions, you'll be redirected to a empty page. Copy the URL on this page and return back to the Google Authentication Tool page.
   - In the "Generate Token" section, paste the url then click "GenerateToken"
   - The Token will appear at the bottom of the page. Copy the token and save it in a new .json file for use with Google APIs.
