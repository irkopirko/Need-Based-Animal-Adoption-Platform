# Need-Based Animal Adoption Platform

## Overview

This project is a web-based platform designed to improve the animal adoption process by focusing on compatibility rather than appearance.

Instead of allowing users to freely browse animals, the system evaluates how well an adopter’s lifestyle matches an animal’s needs. Based on this evaluation, only suitable animals are presented to the user. This approach aims to reduce unsuccessful adoptions and promote responsible decision-making.

---

## Project Purpose

Traditional adoption platforms mostly rely on simple listings, where users choose animals based on photos and limited information. This often leads to mismatches between adopters and animals.

This platform introduces a **compatibility-based adoption model**, where:

* Adopters provide detailed information about their lifestyle and environment
* Animal owners/shelters provide detailed animal profiles
* The system calculates a compatibility score
* Only animals above a certain threshold are recommended

---

## Key Features

* User registration with role selection (Adopter / Animal Owner / Shelter)
* Multi-step adoption profile creation
* Compatibility-based animal matching system
* Detailed animal profiles (behavior, health, needs, etc.)
* Save animals for later review
* Messaging system between adopters and owners/shelters
* Animal listing management for owners/shelters

---

## System Architecture

The system follows a **layered architecture**:

* **Frontend (UI):** Web-based user interface
* **Backend Services:** Business logic and API layer
* **Database:** Relational database for storing users, animals, and profiles

Backend is modularized into:

* User Management
* Adoption Profile Management
* Animal Profile Management
* Matching Engine
* Messaging System

---

## Technologies (Planned)

### Frontend

* React (UI development)
* HTML, CSS, JavaScript

### Backend

* REST API (Node.js / Java-based backend depending on implementation)
* JWT-based authentication

### Database

* Relational Database (e.g., MySQL / PostgreSQL)

---

## How It Works

1. User registers and selects a role
2. Adopter fills out a multi-step adoption profile
3. System evaluates compatibility with available animals
4. Only matching animals are displayed
5. User can:

   * View detailed profiles
   * Save animals
   * Contact owners/shelters

---

## Project Scope

Included:

* User accounts and roles
* Adoption profiles
* Animal registration and management
* Matching system
* Messaging functionality

Not included:

* Payment systems
* Veterinary integrations
* Mobile applications
* Real-time tracking

---

## Getting Started

Clone the repository:

```bash
git clone https://github.com/irkopirko/Need-Based-Animal-Adoption-Platform.git
cd Need-Based-Animal-Adoption-Platform
```

Install dependencies and run the project depending on the frontend/backend setup.

---

## Project Goal

The main goal of this project is to demonstrate that a compatibility-based system can improve the adoption process for both animals and adopters, leading to more sustainable and responsible adoptions.

---

## Contributors

* Ayşe Ceren Sarıgül
* İrem Çelik

---

## Notes

This project is developed as part of a Graduation Design Project.
The system is intended as a prototype demonstrating the concept of compatibility-based adoption.
