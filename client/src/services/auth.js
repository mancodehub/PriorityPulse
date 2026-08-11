export function loginRequest({ email }) {
  return Promise.resolve({ success: true, user: { email } });
}

export function registerRequest({ email, name }) {
  return Promise.resolve({ success: true, user: { email, name } });
}
