FROM maven:3.9.11-eclipse-temurin-17 AS build

WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -DskipTests
COPY src src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre

WORKDIR /app
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
# Keep the JVM inside Render's free-plan memory limit (512 MB); without a cap the
# container can be killed during startup and the deploy fails, leaving the old version live.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-XX:+UseSerialGC", "-Xss512k", "-jar", "app.jar"]