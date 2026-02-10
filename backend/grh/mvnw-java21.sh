#!/bin/bash
# Helper script to run Maven with Java 21
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
./mvnw "$@"
