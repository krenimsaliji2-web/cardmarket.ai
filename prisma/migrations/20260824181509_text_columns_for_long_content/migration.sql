-- AlterTable
ALTER TABLE `card` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `listing` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `message` MODIFY `message` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `notification` MODIFY `message` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `report` MODIFY `reason` TEXT NOT NULL,
    MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `review` MODIFY `comment` TEXT NULL;

-- AlterTable
ALTER TABLE `seller_profile` MODIFY `bio` TEXT NULL,
    MODIFY `shortDescription` TEXT NULL,
    MODIFY `longDescription` TEXT NULL,
    MODIFY `website` TEXT NULL,
    MODIFY `instagramUrl` TEXT NULL,
    MODIFY `facebookUrl` TEXT NULL,
    MODIFY `youtubeUrl` TEXT NULL,
    MODIFY `discordUrl` TEXT NULL,
    MODIFY `shopRules` TEXT NULL,
    MODIFY `returnPolicy` TEXT NULL;
