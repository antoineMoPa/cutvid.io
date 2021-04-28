
package main

import (
	"bufio"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"github.com/alecthomas/geoip"
	"github.com/julienschmidt/httprouter"
	"log"
	"net/http"
	"os"
	"time"
	"net"
)

var geo *geoip.GeoIP

func Index(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	fmt.Fprint(w, "cutvid.io stats server.\n")
}

// Generates a hash of an IP and returns part of this hash plus the country
// we guessed from the IP.
func anonymize(ip string) string {
	country := getCountry(ip)
	bytes := []byte(ip)
	hash := sha256.Sum256(bytes)
	return base64.URLEncoding.EncodeToString(hash[:])[0:10] + "-" + country
}

// Guess an ip address's country.
func getCountry(ip string) string {
	if geo == nil {
		return "Error - geo not set."
	}

	parsedIp := net.ParseIP(ip)

	if parsedIp == nil {
		return "X-Forwarded-For not set to a recognizable ip."
	}

	return geo.Lookup(parsedIp).Long
}

// Main stats route that will log requests to a log file
func Stats(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	fmt.Fprintf(w, ps.ByName("stat"))
	f, err := os.OpenFile("cutvidio-stats.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Println(err)
	}
	filewriter := bufio.NewWriter(f)
	currentTime := time.Now()
	formattedTime := currentTime.Format("2006.01.02 15:04:05")
	forwardedIp := r.Header.Get("X-Forwarded-For")
	defer f.Close()
	if _, err := fmt.Fprintf(filewriter, "%s - %s - %s\n", formattedTime, anonymize(forwardedIp), ps.ByName("stat")); err != nil {
		log.Println(err)
	}
	filewriter.Flush()
}

func main() {
	log.Printf("Loading geoip.")
	var err error
	geo, err = geoip.New()
	if err != nil {
		panic(err.Error())
	}

	router := httprouter.New()
	router.GET("/", Index)
	router.GET("/stats/*stat", Stats)

	log.Printf("Stats about to listen on port 10001")
	log.Fatal(http.ListenAndServe(":10001", router))
}
