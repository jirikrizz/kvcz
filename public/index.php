<?php

use DI\Container;
use Slim\Factory\AppFactory;
use App\Services\DatabaseService;
use App\Services\ShoptetService;
use App\Services\BloomreachService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

require_once __DIR__ . '/../vendor/autoload.php';

$config = require __DIR__ . '/../config/config.php';

// Dependency Container
$container = new Container();
AppFactory::setContainer($container);

$container->set('shoptetService', function () use ($config) {
    return new ShoptetService($config['shoptet']);
});

$container->set('bloomreachService', function () use ($config) {
    return new BloomreachService($config['bloomreach']);
});

$container->set('databaseService', function () use ($config) {
    return new DatabaseService($config['db']);
});

$app = AppFactory::create();

// Middleware pro zobrazování chyb (pro vývojové účely)
$app->addErrorMiddleware(true, true, true);

$app->post('/webhook', function (Request $request, Response $response) use ($container) {
    $shoptetService = $container->get('shoptetService');
    $bloomreachService = $container->get('bloomreachService');
    $databaseService = $container->get('databaseService');

	$rawData = (string) $request->getBody();
	$webhookData = json_decode($rawData, true);

    // Ověření webhooku
	/*
    $signature = $request->getHeaderLine('X-Shoptet-Signature');
    if (!$shoptetService->verifyWebhookSignature($webhookData, $signature)) {
        $bodyStream = $response->getBody();
        $bodyStream->write('Neplatný podpis webhooku.');
        return $response->withStatus(403)->withBody($bodyStream);
    }
	*/
    // Uložit webhook do databáze
    $webhookId = $databaseService->saveWebhookToDatabase($webhookData);

    // Získat detaily objednávky z Shoptet API
    $orderDetails = $shoptetService->fetchOrderDetails($webhookData['eventInstance']);

    // Aktualizovat databázi s detaily objednávky
    $databaseService->saveOrderDetailToDatabase($webhookId, $orderDetails);

    // Odeslat data do Bloomreach
//    $bloomreachService->sendToBloomreach($orderDetails);

    $response->getBody()->write("Webhook zpracován.");
    return $response;
});

$app->run();