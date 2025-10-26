FROM mongo:8.0.9


# Install dependencies and Python
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && apt-get clean

COPY certs/mongodb.pem /etc/ssl/mongodb/mongodb.pem
COPY certs/ca.pem /etc/ssl/mongodb/ca.pem

COPY mongo-init.js /docker-entrypoint-initdb.d/mongo-init.js

# Install required packages and AWS CLI
RUN apt-get update && apt-get install -y \
    curl \
    jq
    
# Upgrade pip and install awscli
# RUN pip3 install --break-system-packages awscli

COPY mongod.conf /etc/mongod.conf

WORKDIR /mongo

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["mongod", "--config", "/etc/mongod.conf"]
EXPOSE 27019