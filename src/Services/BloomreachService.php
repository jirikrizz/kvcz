<?php

namespace App\Services;

use GuzzleHttp\Client;

class BloomreachService
{
    private $config;
    private $client;

    public function __construct($config)
    {
        $this->config = $config;
        $this->client = new Client(['base_uri' => 'https://api.bloomreach.com']);
    }

    public function sendToBloomreach($data)
    {
        $response = $this->client->post('/path-to-bloomreach-endpoint', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->config['bloomreach']['api_key']
            ],
            'json' => $data
        ]);

        if ($response->getStatusCode() !== 200) {
            throw new \Exception("Failed to send data to Bloomreach.");
        }
    }
}