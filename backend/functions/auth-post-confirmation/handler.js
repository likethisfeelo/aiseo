const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const cognito = new CognitoIdentityProviderClient({});

// Cognito 가입 확정(이메일 인증 완료) 시 자동으로 `community` 그룹을 부여.
// docs/membership-260602.md 의 흐름 1·4 (apex/site 양쪽 공통 시작점).
//
// 트리거 이벤트 종류:
//   - PostConfirmation_ConfirmSignUp  : 자체 가입 + 코드 확인
//   - PostConfirmation_ConfirmForgotPassword : 비번 재설정 — 신규 사용자 아님, 스킵
//
// 반환값: 받은 event 를 그대로 돌려줘야 Cognito 가 다음 단계 진행.
// 예외가 던져지면 가입 자체가 실패하므로 try/catch 로 항상 swallow.
const DEFAULT_GROUP = 'community';

exports.handler = async (event) => {
  const trigger = event.triggerSource || '';
  if (trigger !== 'PostConfirmation_ConfirmSignUp') {
    return event;
  }

  const userPoolId = event.userPoolId;
  const username = event.userName;

  if (!userPoolId || !username) {
    console.warn('post-confirmation: missing userPoolId or userName', { userPoolId, username });
    return event;
  }

  try {
    await cognito.send(new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: DEFAULT_GROUP,
    }));
    console.log('post-confirmation: granted', DEFAULT_GROUP, 'to', username);
  } catch (err) {
    // 그룹이 없거나 IAM 권한 누락 시 가입 자체가 실패하면 사용자 경험이 망가지므로
    // 로그만 남기고 통과. 실패해도 사후에 /admin/users/grant 로 수동 복구 가능.
    console.error('post-confirmation: AdminAddUserToGroup failed', err);
  }

  return event;
};
