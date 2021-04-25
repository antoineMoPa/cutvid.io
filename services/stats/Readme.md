# Stats

This service is called by the frontend to log specific user actions to a file called cutvidio-stats.log. As an example, it can be called in Javascript with a simple fetch:

    fetch("/stats/name_of_the_action_you_want_to_track")

This is assuming a proxy is redirecting /fetch to port 10001 on the server.

The goal is to measure user success:

  - can people upload videos ?
  - delete videos ?
  - do people have webgl2 ?
  - etc.

Before this service, I used to look only at nginx logs and it was painful because of all the robots making spam HTTP requests.

# Server configuration

Example nginx proxy configuration:


        location /stats {
            proxy_pass http://127.0.0.1:10001;
            proxy_set_header X-Forwarded-For $remote_addr;
        }