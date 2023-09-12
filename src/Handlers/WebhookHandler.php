<?php

class WebhookHandler {
    private $services = [];

    public function registerService($eventName, $service) {
        $this->services[$eventName] = $service;
    }

    public function handle($webhookData) {
        $event = $webhookData['event'];
        if (isset($this->services[$event])) {
            $service = $this->services[$event];
            $service->process($webhookData);
        }
    }
}