<?php

namespace App\Services;

use GuzzleHttp\Client;

class ShoptetService
{
    private $config;
    private $client;

    public function __construct($config)
    {
        $this->config = $config;
        $this->client = new Client(['base_uri' => 'https://api.myshoptet.com']);
    }
/*
    public function verifyWebhookSignature($data, $signature)
    {
        $computedSignature = hash_hmac('sha1', json_encode($data), $this->config['shoptet']['signature_key']);
        return hash_equals($computedSignature, $signature);
    }
*/
    public function fetchOrderDetails($eventInstance)
    {
        $response = $this->client->get("/api/orders/{$eventInstance}", [
            'headers' => [
				'Content-Type' => 'application/vnd.shoptet.v1.0',
				'Shoptet-Private-API-Token' => $this->config['access_token']
            ]
        ]);

        if ($response->getStatusCode() === 200) {
            return json_decode($response->getBody(), true);
        }

        throw new \Exception("Failed to fetch order details from Shoptet.");
    }
}