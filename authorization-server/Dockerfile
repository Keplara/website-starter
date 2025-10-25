FROM gradle:8.14.3-jdk17-alpine AS build
WORKDIR /app
COPY . .
RUN gradle clean build --no-daemon -x test

FROM openjdk:17-alpine
WORKDIR /app
# ✅ Copies certs either way
COPY --from=build /app/certs /certs
COPY --from=build /app/build/libs/*.jar app.jar
# call medical honor health neurolgy and oasis ent  
# password not being set via environment variable
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]