import jwt from "jsonwebtoken";
import { UniqueIdentityBlockchain } from "./UniqueIdentityBlockchain";

export interface OAuthClient {
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

export interface OAuthTokenRequest {
  uid: string;
  clientId: string;
  clientSecret: string;
  scope?: string[];
  expiresInSeconds?: number;
}

export interface OAuthTokenResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  scope: string;
}

export interface IdentityOAuthOptions {
  blockchain: UniqueIdentityBlockchain;
  clients: OAuthClient[];
  signingSecret: string;
  issuer?: string;
  defaultExpirationSeconds?: number;
}

export class IdentityOAuthService {
  private readonly blockchain: UniqueIdentityBlockchain;

  private readonly clients: Map<string, OAuthClient>;

  private readonly signingSecret: string;

  private readonly issuer: string;

  private readonly defaultExpirationSeconds: number;

  constructor(options: IdentityOAuthOptions) {
    if (!options.signingSecret) {
      throw new Error("Um signingSecret é necessário para emitir tokens.");
    }

    if (!options.clients.length) {
      throw new Error("Ao menos um client OAuth deve ser registrado.");
    }

    this.blockchain = options.blockchain;
    this.signingSecret = options.signingSecret;
    this.clients = new Map(options.clients.map((client) => [client.clientId, client]));
    this.issuer = options.issuer ?? "redis-agents-oauth";
    this.defaultExpirationSeconds = options.defaultExpirationSeconds ?? 3600;
  }

  issueToken(request: OAuthTokenRequest): OAuthTokenResponse {
    const client = this.clients.get(request.clientId);

    if (!client || client.clientSecret !== request.clientSecret) {
      throw new Error("Credenciais do cliente OAuth inválidas.");
    }

    if (!this.blockchain.authenticate(request.uid)) {
      throw new Error("Identidade não é reconhecida ou a cadeia foi adulterada.");
    }

    const requestedScopes = request.scope ?? client.scopes;
    const isScopeAllowed = requestedScopes.every((scope) => client.scopes.includes(scope));

    if (!isScopeAllowed) {
      throw new Error("Escopo solicitado não permitido para este client.");
    }

    const issuedAtSeconds = Math.floor(Date.now() / 1000);
    const expiresInSeconds = request.expiresInSeconds ?? this.defaultExpirationSeconds;
    const scopeString = requestedScopes.join(" ");

    const payload = {
      iss: this.issuer,
      sub: request.uid,
      aud: client.clientId,
      scope: scopeString,
      iat: issuedAtSeconds,
      exp: issuedAtSeconds + expiresInSeconds,
    } satisfies jwt.JwtPayload;

    const accessToken = jwt.sign(payload, this.signingSecret);

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: expiresInSeconds,
      scope: scopeString,
    };
  }
}
