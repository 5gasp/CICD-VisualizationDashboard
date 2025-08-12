FROM nginx:1.19.10

LABEL maintainer="NGINX Docker Maintainers <docker-maint@nginx.com>"

# changed/new
COPY ./docker/docker-entrypoint.sh /
ADD ./website /var/www/html/
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
# end changed/new

EXPOSE 80

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]