plugins {
    id("com.android.application")
}

android {
    namespace = "de.imrestales.heldensturm"
    compileSdk = 34

    defaultConfig {
        applicationId = "de.imrestales.heldensturm"
        minSdk = 24
        targetSdk = 34
        // Auf GitHub zählt jeder Build hoch, damit Android/Obtainium ihn als Update erkennen (HS_VERSION setzt der Workflow)
        val run = (System.getenv("HS_VERSION") ?: "0").toInt()
        versionCode = 1000 + run
        versionName = "1.$run"
    }

    // Fester Schlüssel: liegt verschlüsselt im Repo (keystore/heldensturm.jks.enc) und wird auf GitHub
    // mit dem Secret HELDENSTURM_SCHLUESSEL entschlüsselt. Ohne ihn: Debug-Schlüssel (nicht update-fähig).
    val hsKey = rootProject.file("keystore/heldensturm.jks")
    signingConfigs {
        create("hs") {
            storeFile = hsKey
            storePassword = "heldensturm-gold"
            keyAlias = "heldensturm"
            keyPassword = "heldensturm-gold"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName(if (hsKey.exists()) "hs" else "debug")
        }
    }

    // Töne, Videos, Bilder und Schriften sind schon gepackt – unkomprimiert lädt die App sie schneller
    androidResources {
        noCompress += listOf("mp3", "webm", "webp", "woff2", "png", "ogg")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }
}
