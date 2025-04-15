-- Script de migration pour ajouter la colonne 'image' à la table 'classrooms'
-- Exécuter ce script sur votre base de données pour mettre à jour le schéma

-- Vérifier si la colonne existe déjà
SET @dbname = DATABASE();
SET @tablename = "classrooms";
SET @columnname = "image";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 'La colonne existe déjà, aucune action nécessaire.' AS message;",
  "ALTER TABLE classrooms ADD COLUMN image VARCHAR(255) AFTER features;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Mise à jour des images par défaut pour les salles existantes en fonction de leur type
UPDATE classrooms 
SET image = CASE 
    WHEN type = 'Lecture Hall' THEN '/images/lecture-hall.jpg'
    WHEN type = 'Computer Lab' THEN '/images/computer-lab.jpg'
    WHEN type = 'Conference Room' THEN '/images/conference-room.jpg'
    ELSE '/images/classroom-default.jpg'
END
WHERE image IS NULL;