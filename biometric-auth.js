class BiometricAuth {
    constructor() {
        this.rpId = window.location.hostname;
        this.rpName = "Smart Attendance System";
        this.timeout = 60000;
        this.userVerification = "preferred";
    }

    // Check if WebAuthn is supported
    isSupported() {
        return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get && window.PublicKeyCredential);
    }

    // Generate challenge
    generateChallenge() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return array;
    }

    // Convert string to ArrayBuffer
    stringToArrayBuffer(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }

    // Convert ArrayBuffer to base64
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // Convert base64 to ArrayBuffer
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Get username from hidden input
    getUsername() {
        const usernameInput = document.getElementById('login-username');
        return usernameInput ? usernameInput.value : 'default-user';
    }



    // Authenticate using biometric
    async authenticate() {
        if (!this.isSupported()) {
            throw new Error('WebAuthn is not supported in this browser');
        }

        const username = this.getUsername();
        if (!username) {
            throw new Error('Username is required for authentication');
        }

        // Get stored credential
        const storedCredential = localStorage.getItem(`biometric_${username}`);
        if (!storedCredential) {
            throw new Error('No biometric credential found. Please register first.');
        }

        const credentialData = JSON.parse(storedCredential);
        const challenge = this.generateChallenge();

        const publicKeyCredentialRequestOptions = {
            challenge: challenge,
            allowCredentials: [{
                id: this.base64ToArrayBuffer(credentialData.rawId),
                type: 'public-key'
            }],
            userVerification: this.userVerification,
            timeout: this.timeout
        };

        try {
            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });

            if (!assertion) {
                throw new Error('Authentication failed - no assertion received');
            }

            // Verify the credential ID matches
            if (assertion.id !== credentialData.id) {
                throw new Error('Credential ID mismatch');
            }

            return {
                success: true,
                credentialId: assertion.id,
                message: 'Biometric authentication successful'
            };

        } catch (error) {
            console.error('Authentication error:', error);
            
            if (error.name === 'NotAllowedError') {
                throw new Error('Biometric authentication was cancelled or failed');
            } else if (error.name === 'NotSupportedError') {
                throw new Error('Biometric authentication is not supported on this device');
            } else if (error.name === 'SecurityError') {
                throw new Error('Security error during biometric authentication');
            } else if (error.name === 'InvalidStateError') {
                throw new Error('Invalid state during biometric authentication');
            } else {
                throw new Error(`Authentication failed: ${error.message}`);
            }
        }
    }



    // Register biometric credential
    async register() {
        if (!this.isSupported()) {
            throw new Error('WebAuthn is not supported in this browser');
        }

        const username = this.getUsername();
        if (!username) {
            throw new Error('Username is required for registration');
        }

        const challenge = this.generateChallenge();
        const userId = this.stringToArrayBuffer(username);

        const publicKeyCredentialCreationOptions = {
            challenge: challenge,
            rp: {
                name: this.rpName,
                id: this.rpId,
            },
            user: {
                id: userId,
                name: username,
                displayName: username,
            },
            pubKeyCredParams: [
                {
                    alg: -7, // ES256
                    type: "public-key"
                },
                {
                    alg: -257, // RS256
                    type: "public-key"
                }
            ],
            authenticatorSelection: {
                userVerification: this.userVerification,
                requireResidentKey: false
            },
            timeout: this.timeout,
            attestation: "none"
        };

        try {
            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            if (!credential) {
                throw new Error('Failed to create credential');
            }

            const credentialData = {
                id: credential.id,
                rawId: this.arrayBufferToBase64(credential.rawId),
                type: credential.type,
                username: username,
                timestamp: Date.now()
            };

            localStorage.setItem(`biometric_${username}`, JSON.stringify(credentialData));
            
            return {
                success: true,
                credentialId: credential.id,
                message: 'Biometric registration successful'
            };

        } catch (error) {
            console.error('Registration error:', error);
            throw new Error(`Registration failed: ${error.message}`);
        }
    }

    // Check if user has registered biometric
    hasStoredCredential(username = null) {
        const user = username || this.getUsername();
        return localStorage.getItem(`biometric_${user}`) !== null;
    }
}

// Initialize global instance
window.BiometricAuth = BiometricAuth;