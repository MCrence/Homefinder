-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 05, 2025 at 02:53 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `homefinder`
--
CREATE DATABASE IF NOT EXISTS `homefinder` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `homefinder`;

-- --------------------------------------------------------

--
-- Table structure for table `apartments`
--

CREATE TABLE `apartments` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `status` enum('available','rented','maintenance') DEFAULT 'available',
  `photo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `apartments`
--

INSERT INTO `apartments` (`id`, `owner_id`, `title`, `location`, `price`, `status`, `photo`) VALUES
(8, 1, 'Sunny Studio Apartment', 'Bayugan City, Agusan Del Sur', 17160.90, 'rented', '/uploads/apt_1747718895205.jpg'),
(9, 1, 'Luxury Room', 'Butuan City, Agusan Del Norte', 23099.90, 'available', '/uploads/apt_1747729072450.jpg'),
(10, 1, 'Custody Apartment', 'Davao City, Davao Del Sur', 21099.90, 'maintenance', '/uploads/apt_1747761412966.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `apartment_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `status` enum('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  `previous_status` varchar(20) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `apartment_id`, `tenant_id`, `appointment_date`, `appointment_time`, `status`, `previous_status`, `notes`, `created_at`, `updated_at`) VALUES
(5, 8, 2, '2025-06-07', '13:45:00', 'confirmed', NULL, 'Hello!', '2025-05-20 05:29:03', '2025-05-22 07:17:57'),
(6, 9, 2, '2025-05-20', '16:18:00', 'cancelled', NULL, 'Quick booking', '2025-05-20 08:18:31', '2025-05-21 16:00:43'),
(7, 8, 2, '2025-05-30', '16:49:00', 'cancelled', NULL, 'Quick booking', '2025-05-20 08:50:13', '2025-05-21 14:22:24'),
(8, 8, 2, '2025-05-20', '22:26:00', 'completed', NULL, 'Quick booking', '2025-05-20 14:26:32', '2025-05-21 15:41:16'),
(9, 8, 2, '2025-06-05', '17:00:00', 'completed', NULL, 'Comming', '2025-05-20 15:17:21', '2025-05-21 14:19:38'),
(10, 10, 2, '2025-06-05', '05:18:00', 'cancelled', NULL, 'I Don\'t know', '2025-05-20 17:18:48', '2025-05-21 14:20:14'),
(11, 10, 2, '2025-05-25', '03:30:00', 'pending', NULL, 'Is still available?', '2025-05-22 07:29:18', '2025-05-22 07:29:18');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `user_type` enum('tenant','property_owner') NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `user_type`, `first_name`, `last_name`, `phone`, `created_at`) VALUES
(1, 'mcrence', 'lawrencemcuano@asscat.edu.ph', '$2b$10$7HqPwWqe1B.ePSS7nQqAVupjkoqWg2TVsWr13tTfGslwvpsUdxACS', 'property_owner', 'lawrence', 'cuano', '09485022482', '2025-05-20 05:26:21'),
(2, 'AngelMc', 'cuanobert@gmail.com', '$2b$10$m3onkSS7dCS3LH9DDwWzdeUErrG3dgR8Gb7R8G1F3BkLrHu5p0pm2', 'tenant', 'Angelber', 'Cuano', '09124604966', '2025-05-20 05:28:44');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `apartments`
--
ALTER TABLE `apartments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `apartment_id` (`apartment_id`),
  ADD KEY `tenant_id` (`tenant_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `apartments`
--
ALTER TABLE `apartments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `apartments`
--
ALTER TABLE `apartments`
  ADD CONSTRAINT `apartments_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`apartment_id`) REFERENCES `apartments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
