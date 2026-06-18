<?php
// feedback.php
// Central feedback endpoint for staging websites - Support Chat & Persistence

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST");
header("Content-Type: application/json; charset=UTF-8");

$method = $_SERVER['REQUEST_METHOD'];

// 1. Verify Authentication Cookie
$authenticated = false;
foreach ($_COOKIE as $key => $value) {
    if (strpos($key, 'unlocked_') === 0) {
        if (preg_match('/^[a-f0-9]{64}$/i', $value)) {
            $authenticated = true;
            break;
        }
    }
}

if (!$authenticated) {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false) {
        $authenticated = true;
    }
}

if (!$authenticated) {
    http_response_code(403);
    echo json_encode(["error" => "Accès refusé. Vous devez être connecté au site de démonstration."]);
    exit;
}

$private_dir = __DIR__ . '/../private';
$feedback_file = $private_dir . '/feedback.json';

// Helper to get feedbacks
function get_feedbacks() {
    global $feedback_file;
    if (file_exists($feedback_file)) {
        return json_decode(file_get_contents($feedback_file), true) ?: [];
    }
    return [];
}

// Handle GET (fetch discussion thread)
if ($method === 'GET') {
    $feedbacks = get_feedbacks();
    
    // Optional filter by section
    $section = isset($_GET['section']) ? trim($_GET['section']) : '';
    
    if (!empty($section)) {
        $feedbacks = array_filter($feedbacks, function($fb) use ($section) {
            return ($fb['section'] === $section);
        });
        // Reset array keys
        $feedbacks = array_values($feedbacks);
    }
    
    echo json_encode($feedbacks);
    exit;
}

// Handle POST (submit new comment)
if ($method === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    $name = isset($data['name']) ? trim($data['name']) : '';
    $section = isset($data['section']) ? trim($data['section']) : '';
    $section_id = isset($data['section_id']) ? trim($data['section_id']) : '';
    $comment = isset($data['comment']) ? trim($data['comment']) : '';
    $url = isset($data['url']) ? trim($data['url']) : '';

    if (empty($name) || empty($comment) || empty($section)) {
        http_response_code(400);
        echo json_encode(["error" => "Champs requis manquants (name, section, comment)."]);
        exit;
    }

    if (!is_dir($private_dir)) {
        mkdir($private_dir, 0755, true);
    }

    $feedbacks = get_feedbacks();

    function get_client_ip() {
        $ip_keys = array('HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR');
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP) !== false) {
                        return $ip;
                    }
                }
            }
        }
        return '0.0.0.0';
    }

    $new_feedback = [
        'id' => uniqid('fb_', true),
        'date' => date('Y-m-d H:i:s'),
        'ip' => get_client_ip(),
        'name' => htmlspecialchars($name),
        'section' => htmlspecialchars($section),
        'section_id' => htmlspecialchars($section_id),
        'comment' => htmlspecialchars($comment),
        'url' => htmlspecialchars($url),
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Inconnu'
    ];

    $feedbacks[] = $new_feedback;
    file_put_contents($feedback_file, json_encode($feedbacks, JSON_PRETTY_PRINT));

    // Send Email Notification to contact@enligne.re
    $to = "contact@enligne.re";
    $host = $_SERVER['HTTP_HOST'] ?? 'Staging Site';
    $subject = "[Retour Client] Nouvelle remarque sur " . $host . " (" . $section . ")";

    $message = "Bonjour,\n\n";
    $message .= "Une nouvelle remarque a été laissée par un client sur le site en attente de validation :\n\n";
    $message .= "Détails de la remarque :\n";
    $message .= "- Site : " . $host . "\n";
    $message .= "- Section : " . $section . " (ID: " . ($section_id ?: 'aucun') . ")\n";
    $message .= "- URL complète : " . $url . "\n";
    $message .= "- Auteur : " . $name . "\n";
    $message .= "- Date : " . $new_feedback['date'] . "\n\n";
    $message .= "Message du client :\n";
    $message .= "--------------------------------------------------\n";
    $message .= $comment . "\n";
    $message .= "--------------------------------------------------\n\n";
    $message .= "Toutes les remarques de ce site sont enregistrées localement dans :\n";
    $message .= $feedback_file . "\n\n";
    $message .= "Cordialement,\nLe système de retour d'expérience.";

    $headers = "From: feedback@" . $host . "\r\n";
    $headers .= "Reply-To: no-reply@" . $host . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    mail($to, $subject, $message, $headers);

    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Remarque enregistrée avec succès.", "feedback" => $new_feedback]);
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Méthode non autorisée."]);
exit;
?>
