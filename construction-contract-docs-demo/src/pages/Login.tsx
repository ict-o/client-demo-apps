import { useState, type FormEvent } from 'react';
import type { AppUser } from '../types';
import { DEMO_ACCOUNTS, OWN_COMPANY } from '../data/sampleData';
import { BrandMark } from '../components/Layout';

interface Props {
  onLogin: (user: AppUser) => void;
}

export function Login({ onLogin }: Props) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ loginId?: string; password?: string; form?: string }>({});
  const demo = DEMO_ACCOUNTS[0];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!loginId.trim()) next.loginId = 'ログインIDを入力してください';
    if (!password) next.password = 'パスワードを入力してください';
    if (!next.loginId && !next.password) {
      const account = DEMO_ACCOUNTS.find(a => a.loginId === loginId.trim() && a.password === password);
      if (!account) {
        next.form = 'ログインIDまたはパスワードが違います。もう一度入力してください。';
      } else {
        onLogin({ loginId: account.loginId, name: account.name, department: account.department });
        return;
      }
    }
    setErrors(next);
  };

  const fillDemo = () => {
    setLoginId(demo.loginId);
    setPassword(demo.password);
    setErrors({});
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <BrandMark />
          <div>
            <div className="login-system">工事契約書類管理システム</div>
            <div className="fs-13 text-sub">{OWN_COMPANY.name} {OWN_COMPANY.division}</div>
          </div>
        </div>

        <h1 className="login-title">ログイン</h1>

        <form onSubmit={submit} noValidate>
          {errors.form && (
            <div className="alert alert-error mb-16" role="alert">
              <span aria-hidden="true">!</span>
              <div>{errors.form}</div>
            </div>
          )}

          <div className="field">
            <label className="field-label" htmlFor="login-id">ログインID</label>
            <input
              id="login-id"
              className={errors.loginId ? 'input invalid' : 'input'}
              value={loginId}
              autoComplete="username"
              onChange={e => setLoginId(e.target.value)}
            />
            {errors.loginId && <span className="field-error">{errors.loginId}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="login-pw">パスワード</label>
            <div className="row gap-8">
              <input
                id="login-pw"
                type={showPassword ? 'text' : 'password'}
                className={errors.password ? 'input invalid' : 'input'}
                value={password}
                autoComplete="current-password"
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPassword(!showPassword)}
                aria-pressed={showPassword}
              >
                {showPassword ? '隠す' : '表示'}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block">ログインする</button>
        </form>

        <div className="alert alert-info mt-16">
          <span aria-hidden="true">i</span>
          <div>
            <div className="fw-700">デモ用のアカウント</div>
            <p className="fs-14 mt-4">
              ログインID：<span className="fw-700">{demo.loginId}</span>／パスワード：<span className="fw-700">{demo.password}</span>
            </p>
            <button type="button" className="btn btn-secondary btn-sm mt-8" onClick={fillDemo}>
              デモ用アカウントを入力する
            </button>
          </div>
        </div>

        <p className="fs-13 text-sub mt-16">
          本番では、社員ごとのアカウントでログインします。パスワードを忘れた場合は、システム管理者にお問い合わせください。
        </p>
      </div>
    </div>
  );
}
