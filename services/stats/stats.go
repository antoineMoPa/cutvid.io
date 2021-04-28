
package main

import (
	"bufio"
	"fmt"
	"github.com/julienschmidt/httprouter"
	"log"
	"net/http"
	"os"
	"time"
)

func Index(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	fmt.Fprint(w, "cutvid.io stats server.\n")
}

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
	if _, err := fmt.Fprintf(filewriter, "%s - %s - %s\n", formattedTime, forwardedIp, ps.ByName("stat")); err != nil {
		log.Println(err)
	}
	filewriter.Flush()
}

func main() {
	router := httprouter.New()
	router.GET("/", Index)
	router.GET("/stats/*stat", Stats)

	log.Printf("Stats about to listen on port 10001")
	log.Fatal(http.ListenAndServe(":10001", router))
}
