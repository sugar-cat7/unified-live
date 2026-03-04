FROM mcr.microsoft.com/playwright:v1.57.0-noble

WORKDIR /app

# Install http-server
RUN npm install -g http-server

# Test execution entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER pwuser

ENTRYPOINT ["/docker-entrypoint.sh"]
