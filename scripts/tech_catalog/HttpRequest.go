package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
)

// Request is a struct that holds the data for a request
type Request struct {
	Method       string `json:"method"`
	URL          string `json:"url"`
	GraphQLQuery string `json:"query"`
	payload      map[string]string
	headers      map[string]string
}

// Do will execute the request and returns the response
func (r *Request) Do() (map[string]any, error) {
	// Create the body
	var body []byte

	// If the request is a GraphQL request, then we need to set the payload to the query
	if r.GraphQLQuery != "" {
		r.Method = "POST"
		r.payload = make(map[string]string)
		r.payload["query"] = r.GraphQLQuery
		var e error
		body, e = json.Marshal(r.payload)
		if e != nil {
			log.Printf("failed to marshal Request body: %v", e)
			return nil, e
		}
	} else { // Otherwise, we need to set the payload to the payload string
		payloadString := ""
		for key, value := range r.payload {
			payloadString += key + "=" + value + "&"
		}
		body = []byte(payloadString)
	}

	// Create the request
	httpRequest, err := http.NewRequest(r.Method, r.URL, bytes.NewBuffer(body))
	if err != nil {
		log.Printf("failed to create request: %v", err)
		return nil, err
	}

	// Add the headers
	for k, v := range r.headers {
		httpRequest.Header.Add(k, v)
	}

	// Create the client
	client := &http.Client{}

	// Send the request
	res, err := client.Do(httpRequest)
	if err != nil {
		log.Printf("failed to send request: %v", err)
		return nil, err
	}

	// Close the response body when done
	defer func() {
		err := res.Body.Close()
		if err != nil {
			log.Printf("failed to close response body: %v", err)
		}
	}()

	// Decode the response
	var response map[string]any
	err = json.NewDecoder(res.Body).Decode(&response)
	if err != nil {
		log.Printf("failed to decode response: %v", err)
		return nil, err
	}

	// Return the response and no error
	return response, nil
}

// AddHeader will add a header to the request
func (r *Request) AddHeader(key string, value string) {
	if r.headers == nil {
		r.headers = make(map[string]string)
	}
	r.headers[key] = value
}

// AddPayload will add a header to the request
func (r *Request) AddPayload(key string, value string) {
	if r.payload == nil {
		r.payload = make(map[string]string)
	}
	r.payload[key] = value
}
