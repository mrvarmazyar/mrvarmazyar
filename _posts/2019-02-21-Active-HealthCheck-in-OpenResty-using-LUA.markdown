---
layout: post
title:  "Active HealthCheck in OpenResty using LUA"
date:   2019-02-21 11:49:45 +0200
categories: Nginx
---

This post is going to attempt to demystify the active health check that we have in Nginx Plus with lua in OpenResty. As we know the NGINX and NGINX Plus monitor transactions as they happen, and try to resume failed connections. If the transaction still cannot be resumed, NGINX and NGINX Plus mark the server as unavailable and temporarily stop sending requests to it until it is marked active again. In passive health check we have two argument that values are  [fail_timeout](https://nginx.org/en/docs/http/ngx_http_upstream_module.html?&_ga=2.18619065.16151226.1550668365-142098169.1548027214#fail_timeout)  and  [max_fails](https://nginx.org/en/docs/http/ngx_http_upstream_module.html?&_ga=2.18619065.16151226.1550668365-142098169.1548027214#max_fails). For example we have:

```nginx
upstream MyApp {  
    server worker1.domain.local:8080 max_fails=3 fail_timeout=30s;  
    server worker1.domain.local:8080 max_fails=3 fail_timeout=30s;  
}
```

The active health check is only supported in Nginx plus so we need get our hands dirty with lua in openresty or nginx with LUAjit module. Imagine that one upstream is a 5x or 4x error. If you do not use the solution that I will explain in this post, the queries will be faced with each other in error.

In this article we have to use lua-resty-upstream-healthcheck for Active mode.This library performs healthcheck for server peers defined in NGINX  `upstream`  groups specified by names.

Here is my configurations for setup active healthcheck in openresty:

Active_healthcheck.lua :

```lua
init_worker_by_lua_block {

local hc = require "resty.upstream.healthcheck"

local ok, err = hc.spawn_checker{

shm = "myhealthcheck", -- defined by "lua_shared_dict"

upstream = "MyUpstreams", -- defined by "upstream"

type = "http",

http_req = "GET / HTTP/1.0\r\nHost: www.mohammad.com\r\n\r\n",

-- raw HTTP request for checking

interval = 3000, -- run the check cycle every 3 sec

timeout = 3000, -- 3 sec is the timeout for network operations

fall = 3, -- # of successive failures before turning a peer down

rise = 2, -- # of successive successes before turning a peer up

valid_statuses = {200}, -- a list valid HTTP status code

concurrency = 10, -- concurrency level for test requests

}

if not ok then

ngx.log(ngx.ERR, "failed to spawn health checker: ", err)

return

end

}
```
docker-compose.yml

```yaml
version: '3.4'
services:
    nginx:
        container_name: nginx
        image: openresty/openresty:alpine
        logging:
          driver: "json-file"
          options:
            max-size: "100m"
            max-file: "10"            
        volumes:
            - /etc/localtime:/etc/localtime:ro
            - /etc/localtime:/etc/timezone:ro
            - ./etc/nginx:/etc/nginx
            - ./openresty:/usr/local/openresty/nginx/conf/
        ports:
            - mode: host
              protocol: tcp
              published: 80
              target: 80
            - mode: host
              protocol: tcp
              published: 443
              target: 443
        restart: unless-stopped
```
MyUpstream: 

```
upstream MyUpstreams {
    least_conn;
    server 192.168.1.2:8080 max_fails=2;
    server 192.168.1.3:8080 max_fails=2;
    keepalive 60;
}
```

Nginx.conf :

```nginx
worker_processes  auto;
worker_rlimit_nofile 32768;
events {
    worker_connections  8691;
	  use epoll;
	  multi_accept on;
}

http {
  .
  .
  .
  lua_shared_dict myhealthcheck 1m;
  lua_socket_log_errors off;
  include /etc/nginx/configs/active_health_checks.lua;
  include /etc/nginx/upstreams/*;
  include /etc/nginx/site-available/*.conf;
  .
  .
}
```

domain.conf:

```nginx
server {
	listen	80;
	server_name www.mohammad.com;
        location / {
          proxy_pass http://MyUpstreams;
        }
        location = /devopsstatus {
            access_log off;
            allow 192.168.0.0/16;
            allow 127.0.0.1;
            deny all;
            default_type text/plain;
            content_by_lua_block {
                local hc = require "resty.upstream.healthcheck"
                ngx.say("Nginx Worker PID: ", ngx.worker.pid())
                ngx.print(hc.status_page())
            }
        }
```

Note: Different upstreams’ healthcheckers use different keys (by always prefixing the keys with the upstream name), so sharing a single  `lua_shared_dict`  among multiple checkers should not have any issues at all. But you need to compensate the size of the shared dict for multiple users (i.e., multiple checkers). If you have many  upstreams  (thousands or even more), then it is more optimal to use separate shm zones for each (group) of the upstreams.

[This Article in medium]: https://medium.com/@mrvarmazyar/openresty-active-healthcheck-8a1627530eb2

