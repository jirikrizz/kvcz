<?php

namespace App\Services;

use PDO;

class DatabaseService
{
    private $db;

    public function __construct($config)
    {
        $this->db = new PDO(
            "mysql:host={$config['host']};dbname={$config['dbname']}",
            $config['user'],
            $config['password']
        );
		$this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$this->db->exec("SET NAMES utf8mb4");
    }

    public function saveWebhookToDatabase($webhookData)
    {
        $stmt = $this->db->prepare("INSERT INTO webhooks (event_instance, payload) VALUES (:eventInstance, :payload)");
        $stmt->execute([
            ':eventInstance' => $webhookData['eventInstance'],
            ':payload' => json_encode($webhookData) 
        ]);

        return $this->db->lastInsertId();
    }

    public function saveOrderDetailToDatabase($webhookId, $orderDetail)
    {
        $stmt = $this->db->prepare("INSERT INTO order_details (webhook_id, order_id, customer_name, customer_email, customer_guid, total_price, order_status) VALUES (:webhookId, :orderId, :customerName, :customerEmail, :customerGuid, :totalPrice, :orderStatus)");
        $stmt->execute([
            ':webhookId' => $webhookId,
            ':orderId' => $orderDetail['data']['order']['code'],
            ':customerName' => $orderDetail['data']['order']['billingAddress']['fullName'],
            ':customerEmail' => $orderDetail['data']['order']['email'],
            ':customerGuid' => $orderDetail['data']['order']['customerGuid'],
            ':totalPrice' => $orderDetail['data']['order']['price']['withVat'].$orderDetail['data']['order']['price']['currencyCode'],
            ':orderStatus' => $orderDetail['data']['order']['status']['name']
        ]);

        return $this->db->lastInsertId();
    }
}

