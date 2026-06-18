# Websites-tools

Outils partagés pour les sites en attente de validation client sur le réseau Enligne.re.

## 💬 Widget de Remarques Clients (Feedback)

Ce widget permet d'ajouter un bouton discret "💬 Remarque" sur chaque section majeure d'un site en pré-production. Les clients peuvent ainsi faire des retours précis et contextualisés par écrit.

Les retours sont :
1. Enregistrés localement dans un fichier JSON sécurisé (`private/feedback.json`).
2. Transmis instantanément par email à `contact@enligne.re`.

### Intégration sur un site

1. **Copier les fichiers dans le dossier public du site** :
   ```bash
   # Depuis la racine du VPS
   cp /home/david/web/Websites-tools/feedback-widget.js /home/USER/web/DOMAIN/public_html/
   cp /home/david/web/Websites-tools/feedback.php /home/USER/web/DOMAIN/public_html/
   chown USER:USER /home/USER/web/DOMAIN/public_html/feedback*
   ```

2. **Inclure le script dans le layout ou le fichier HTML principal** :
   Ajouter la ligne suivante juste avant la fermeture de la balise `</body>` :
   ```html
   <script src="/feedback-widget.js" defer></script>
   ```

3. **Personnaliser le nom d'une section (Optionnel)** :
   Par défaut, le script devine le nom de la section via son identifiant ID, sa classe CSS ou le premier titre (`h2`, `h3`, etc.) qu'il trouve. Vous pouvez forcer un nom personnalisé en ajoutant l'attribut `data-feedback-name` :
   ```html
   <section id="notre-equipe" data-feedback-name="Présentation de l'équipe">
     ...
   </section>
   ```
