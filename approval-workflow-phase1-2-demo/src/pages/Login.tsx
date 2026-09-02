import { useState } from 'react';
import type { Member } from '../types';
import { DEMO_PASSWORD, OPERATING_COMPANY, roleMeta } from '../data/sampleData';

interface LoginProps {
  members: Member[];
  /** ログインIDとパスワードで認証する。成功した利用者を返す */
  onLogin: (member: Member) => void;
  /** 認証に失敗したことを監査ログへ記録する */
  onLoginFailed: (name: string, reason: string) => void;
}

/** ログイン画面（認証） */
export function Login({ members, onLogin, onLoginFailed }: LoginProps) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (loginId.trim() === '' || password === '') {
      setError('ログインIDとパスワードを入力してください。');
      return;
    }
    const member = members.find(m => m.loginId === loginId.trim());
    if (!member || password !== DEMO_PASSWORD) {
      setError('ログインIDまたはパスワードが正しくありません。');
      onLoginFailed(member?.name ?? loginId.trim(), member ? 'パスワード誤り' : 'ログインIDが存在しない');
      return;
    }
    if (!member.active) {
      setError('このアカウントは無効です。システム管理者にお問い合わせください。');
      onLoginFailed(member.name, '無効アカウント');
      return;
    }
    setError('');
    onLogin(member);
  };

  const fill = (m: Member) => {
    setLoginId(m.loginId);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  return (
    <div className="login-shell">
      <div className="login-box">
        <div className="card card-pad login-card">
          <div className="login-brand">
            <span className="brand-mark" aria-hidden="true">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3.5h8l4.5 4.5v12.5H6z" />
                <path d="M13.5 3.5V8H18" />
                <path d="M9.2 14.2l2.2 2.2 4.2-4.6" />
              </svg>
            </span>
            <div>
              <div className="login-title">契約ワークフロー管理システム</div>
              <div className="login-company">{OPERATING_COMPANY}</div>
            </div>
          </div>

          <form onSubmit={submit} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="login-id">
                ログインID<span className="req">必須</span>
              </label>
              <input
                id="login-id"
                className="input"
                value={loginId}
                autoComplete="username"
                onChange={e => {
                  setLoginId(e.target.value);
                  setError('');
                }}
              />
              {touched && loginId.trim() === '' && <div className="field-error">ログインIDを入力してください</div>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="login-pw">
                パスワード<span className="req">必須</span>
              </label>
              <input
                id="login-pw"
                className="input"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={e => {
                  setPassword(e.target.value);
                  setError('');
                }}
              />
              {touched && password === '' && <div className="field-error">パスワードを入力してください</div>}
            </div>

            {error !== '' && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button className="btn btn-primary btn-lg btn-block mt-16" type="submit">
              ログイン
            </button>
          </form>
        </div>

        <div className="card card-pad login-accounts">
          <div className="section-title">デモ用アカウント</div>
          <p className="fs-13 text-sub mb-8">
            行を選ぶとログインIDとパスワードが入力されます。パスワードはすべて <code className="hash">{DEMO_PASSWORD}</code> です（架空のデモ用アカウントです）。
          </p>
          <div className="login-account-list">
            {members.map(m => (
              <button key={m.id} type="button" className="login-account" onClick={() => fill(m)}>
                <span className="login-account-main">
                  <span className="fw-600">
                    {m.department} {m.title}　{m.name}
                  </span>
                  <span className="fs-12 text-sub">
                    ID: {m.loginId}／権限: {roleMeta[m.role].label}
                    {!m.active && '／無効アカウント'}
                  </span>
                </span>
                <span className="login-account-arrow" aria-hidden="true">
                  ›
                </span>
              </button>
            ))}
          </div>
          <p className="fs-12 text-muted mt-16">
            権限によって使えるメニューと操作が変わります。無効アカウントではログインできず、失敗した操作は監査ログに記録されます。
          </p>
        </div>
      </div>

      <p className="login-foot">
        本画面はデモンストレーション用です。表示されている企業名・担当者名・アカウントはすべて架空のサンプルです。
      </p>
    </div>
  );
}
