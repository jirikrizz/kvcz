<?php

namespace App\Controller;

use App\Service\ShoptetOrderFetcher;
use App\Service\WebhookSaver;
use App\Service\WebhookVerifier;
use App\Service\BloomreachSender;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class WebhookController
{
    private $verifier;
    private $saver;
    private $orderFetcher;

    public function __construct(WebhookVerifier $verifier, WebhookSaver $saver, ShoptetOrderFetcher $orderFetcher)
    {
        $this->verifier = $verifier;
        $this->saver = $saver;
        $this->orderFetcher = $orderFetcher;
    }

    public function handle(Request $request, Response $response)
    {
        $data = $request->getParsedBody();

        if (!$this->verifier->isValid($request)) {
            $response->getBody()->write(json_encode(['error' => 'Invalid webhook signature']));
            return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
        }

        $id = $this->saver->save($data);

        $orderDetails = $this->orderFetcher->fetchOrderDetails($data['eventInstance']);
        if ($orderDetails) {
            $this->saver->updateWithOrderDetails($id, $orderDetails);
        }

        $response->getBody()->write(json_encode(['message' => 'Webhook processed successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }
}