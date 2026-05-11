import jwt from "jsonwebtoken";
import { IdentityOAuthService, UniqueIdentityBlockchain } from "../src/identity";

describe("IdentityOAuthService", () => {
  const signingSecret = "test-secret";

  const createService = (blockchain: UniqueIdentityBlockchain) =>
    new IdentityOAuthService({
      blockchain,
      signingSecret,
      clients: [
        { clientId: "dashboard", clientSecret: "dashboard-secret", scopes: ["agents:read", "agents:write"] },
        { clientId: "auditor", clientSecret: "auditor-secret", scopes: ["agents:read"] },
      ],
      issuer: "redis-agents-oauth-tests",
      defaultExpirationSeconds: 1800,
    });

  it("emite um JWT válido quando UID e client são válidos", () => {
    const blockchain = new UniqueIdentityBlockchain();
    const uid = blockchain.createIdentity("AgentAuth");
    const service = createService(blockchain);

    const token = service.issueToken({
      uid,
      clientId: "dashboard",
      clientSecret: "dashboard-secret",
      scope: ["agents:read"],
    });

    expect(token.tokenType).toBe("Bearer");

    const decoded = jwt.verify(token.accessToken, signingSecret) as jwt.JwtPayload;
    expect(decoded.sub).toBe(uid);
    expect(decoded.aud).toBe("dashboard");
    expect(decoded.scope).toBe("agents:read");
    expect(typeof decoded.exp).toBe("number");
  });

  it("rejeita UID não autenticada", () => {
    const blockchain = new UniqueIdentityBlockchain();
    const service = createService(blockchain);

    expect(() =>
      service.issueToken({
        uid: "nao-registrado",
        clientId: "dashboard",
        clientSecret: "dashboard-secret",
      }),
    ).toThrow(/Identidade não é reconhecida/);
  });

  it("rejeita escopos não permitidos para o client", () => {
    const blockchain = new UniqueIdentityBlockchain();
    const uid = blockchain.createIdentity("Auditor");
    const service = createService(blockchain);

    expect(() =>
      service.issueToken({
        uid,
        clientId: "auditor",
        clientSecret: "auditor-secret",
        scope: ["agents:write"],
      }),
    ).toThrow(/Escopo solicitado não permitido/);
  });

  it("rejeita credenciais de client inválidas", () => {
    const blockchain = new UniqueIdentityBlockchain();
    const uid = blockchain.createIdentity("BadClient");
    const service = createService(blockchain);

    expect(() =>
      service.issueToken({
        uid,
        clientId: "dashboard",
        clientSecret: "invalido",
      }),
    ).toThrow(/Credenciais do cliente OAuth inválidas/);
  });
});
