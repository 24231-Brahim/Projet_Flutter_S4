package com.eventhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class EventHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(EventHubApplication.class, args);
    }
}