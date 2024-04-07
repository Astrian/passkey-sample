declare global {
  interface WebauthnCred {
    id: string
    rawId: string
    response: {
      attestationObject: string?;
      clientDataJSON: string;
      transports: transports[]?;
      publicKeyAlgorithm: number?;
      publicKey: string?;
      authenticatorData: string;
      signature: string?;
      userHandle: string?
    }
    type: "public-key",
    clientExtensionResults: any
    authenticatorAttachment: 'platform' | 'cross-platform'
  }
}

export {}