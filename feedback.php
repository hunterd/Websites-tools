<?php
// feedback.php
// Central feedback endpoint for staging websites - Chat, Edit & History

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
    $client_id = isset($_GET['client_id']) ? trim($_GET['client_id']) : '';
    
    // Remove IP addresses and user agents from public GET for extra privacy
    $public_feedbacks = array_map(function($fb) use ($client_id) {
        $fb['is_mine'] = (!empty($client_id) && isset($fb['client_id']) && $fb['client_id'] === $client_id);
        unset($fb['client_id']);
        unset($fb['ip']);
        unset($fb['user_agent']);
        return $fb;
    }, $feedbacks);
    
    // Optional filter by section
    $section = isset($_GET['section']) ? trim($_GET['section']) : '';
    
    if (!empty($section)) {
        $public_feedbacks = array_filter($public_feedbacks, function($fb) use ($section) {
            return ($fb['section'] === $section);
        });
        $public_feedbacks = array_values($public_feedbacks);
    }
    
    echo json_encode($public_feedbacks);
    exit;
}

// Handle POST (submit or edit comment)
if ($method === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    $action = isset($data['action']) ? trim($data['action']) : 'create';

    // Handle Edit Action
    if ($action === 'edit') {
        $id = isset($data['id']) ? trim($data['id']) : '';
        $client_id = isset($data['client_id']) ? trim($data['client_id']) : '';
        $comment = isset($data['comment']) ? trim($data['comment']) : '';
        $name = isset($data['name']) ? trim($data['name']) : '';

        if (empty($id) || empty($client_id) || empty($comment) || empty($name)) {
            http_response_code(400);
            echo json_encode(["error" => "Champs requis manquants pour la modification."]);
            exit;
        }

        $feedbacks = get_feedbacks();
        $found_index = -1;

        for ($i = 0; $i < count($feedbacks); $i++) {
            if ($feedbacks[$i]['id'] === $id) {
                $found_index = $i;
                break;
            }
        }

        if ($found_index === -1) {
            http_response_code(404);
            echo json_encode(["error" => "Message non trouvé."]);
            exit;
        }

        // Verify client_id ownership
        $stored_client_id = isset($feedbacks[$found_index]['client_id']) ? $feedbacks[$found_index]['client_id'] : '';
        if ($stored_client_id !== $client_id) {
            http_response_code(403);
            echo json_encode(["error" => "Vous n'êtes pas autorisé à modifier ce message."]);
            exit;
        }

        // Check if anything actually changed
        $old_comment = $feedbacks[$found_index]['comment'];
        $old_name = $feedbacks[$found_index]['name'];

        if ($old_comment !== $comment || $old_name !== $name) {
            // Save to edit history
            if (!isset($feedbacks[$found_index]['history'])) {
                $feedbacks[$found_index]['history'] = [];
            }

            $feedbacks[$found_index]['history'][] = [
                'date' => isset($feedbacks[$found_index]['edited_at']) ? $feedbacks[$found_index]['edited_at'] : $feedbacks[$found_index]['date'],
                'name' => $old_name,
                'comment' => $old_comment
            ];

            // Update main values
            $feedbacks[$found_index]['comment'] = htmlspecialchars($comment);
            $feedbacks[$found_index]['name'] = htmlspecialchars($name);
            $feedbacks[$found_index]['edited_at'] = date('Y-m-d H:i:s');

            file_put_contents($feedback_file, json_encode($feedbacks, JSON_PRETTY_PRINT));

            // Send Email Notification of Edit to contact@enligne.re
            $to = "contact@enligne.re";
            $host = $_SERVER['HTTP_HOST'] ?? 'Staging Site';
            $subject = "[Retour Modifié] Remarque modifiée sur " . $host . " (" . $feedbacks[$found_index]['section'] . ")";

            $message = "Bonjour,\n\n";
            $message .= "Une remarque a été modifiée par son auteur sur le site en attente de validation :\n\n";
            $message .= "Détails :\n";
            $message .= "- Site : " . $host . "\n";
            $message .= "- Section : " . $feedbacks[$found_index]['section'] . "\n";
            $message .= "- Date modification : " . $feedbacks[$found_index]['edited_at'] . "\n\n";
            $message .= "Ancien Nom : " . $old_name . "\n";
            $message .= "Nouveau Nom : " . $name . "\n\n";
            $message .= "Ancien Message :\n";
            $message .= "----------------\n" . $old_comment . "\n----------------\n\n";
            $message .= "Nouveau Message :\n";
            $message .= "----------------\n" . $comment . "\n----------------\n\n";
            $message .= "Cordialement,\nLe système de retour d'expérience.";

            $headers = "From: feedback@" . $host . "\r\n";
            $headers .= "Reply-To: no-reply@" . $host . "\r\n";
            $headers .= "X-Mailer: PHP/" . phpversion();

            mail($to, $subject, $message, $headers);
        }

        echo json_encode(["status" => "success", "message" => "Message mis à jour avec succès."]);
        exit;
    }

    // Handle Create Action
    $name = isset($data['name']) ? trim($data['name']) : '';
    $section = isset($data['section']) ? trim($data['section']) : '';
    $section_id = isset($data['section_id']) ? trim($data['section_id']) : '';
    $comment = isset($data['comment']) ? trim($data['comment']) : '';
    $url = isset($data['url']) ? trim($data['url']) : '';
    $client_id = isset($data['client_id']) ? trim($data['client_id']) : '';

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
        'client_id' => htmlspecialchars($client_id),
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

    // Remove client_id, ip, and user_agent from response for privacy
    $public_feedback = $new_feedback;
    unset($public_feedback['client_id']);
    unset($public_feedback['ip']);
    unset($public_feedback['user_agent']);

    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Remarque enregistrée avec succès.", "feedback" => $public_feedback]);
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Méthode non autorisée."]);
exit;
?>
