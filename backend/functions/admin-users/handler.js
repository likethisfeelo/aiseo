const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminListGroupsForUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminGetUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { ok, badRequest, serverError } = require('../shared/response');
const { requireAdmin } = require('../shared/auth');

const cognito = new CognitoIdentityProviderClient({});

const PAID_GROUP = 'paid_member';
const PAGE_LIMIT = 60;

const getAttr = (attrs, name) => {
  const found = (attrs || []).find((a) => a.Name === name);
  return found ? found.Value : '';
};

const fetchGroupsForUser = async (userPoolId, username) => {
  try {
    const res = await cognito.send(new AdminListGroupsForUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    }));
    return (res.Groups || []).map((g) => g.GroupName).filter(Boolean);
  } catch (err) {
    console.error('AdminListGroupsForUser failed', username, err);
    return [];
  }
};

const handleList = async (event) => {
  const userPoolId = process.env.USER_POOL_ID;
  const params = event.queryStringParameters || {};
  const search = (params.search || '').trim();
  const paginationToken = params.paginationToken || undefined;

  const command = new ListUsersCommand({
    UserPoolId: userPoolId,
    Limit: PAGE_LIMIT,
    PaginationToken: paginationToken,
    ...(search ? { Filter: `email ^= "${search.replace(/"/g, '')}"` } : {}),
  });

  const res = await cognito.send(command);
  const items = res.Users || [];

  const users = await Promise.all(items.map(async (u) => {
    const groups = await fetchGroupsForUser(userPoolId, u.Username);
    return {
      sub: getAttr(u.Attributes, 'sub') || u.Username,
      username: u.Username,
      email: getAttr(u.Attributes, 'email'),
      name: getAttr(u.Attributes, 'name'),
      emailVerified: getAttr(u.Attributes, 'email_verified') === 'true',
      enabled: u.Enabled !== false,
      status: u.UserStatus || '',
      createdAt: u.UserCreateDate ? new Date(u.UserCreateDate).toISOString() : '',
      groups,
      isPaid: groups.includes(PAID_GROUP),
      isAdmin: groups.includes('admin'),
    };
  }));

  return ok({
    users,
    nextToken: res.PaginationToken || null,
    count: users.length,
  }, event);
};

const parseBody = (event) => {
  if (!event.body) return {};
  if (typeof event.body === 'string') return JSON.parse(event.body);
  return event.body;
};

const handleMutate = async (event, action) => {
  const userPoolId = process.env.USER_POOL_ID;
  const body = parseBody(event);
  const username = (body.username || body.sub || '').trim();
  if (!username) return badRequest('username 또는 sub가 필요합니다.', event);

  const Command = action === 'grant' ? AdminAddUserToGroupCommand : AdminRemoveUserFromGroupCommand;
  await cognito.send(new Command({
    UserPoolId: userPoolId,
    Username: username,
    GroupName: PAID_GROUP,
  }));

  // Re-fetch user state for confirmation
  let user = null;
  try {
    const res = await cognito.send(new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    }));
    const groups = await fetchGroupsForUser(userPoolId, username);
    user = {
      sub: getAttr(res.UserAttributes, 'sub') || res.Username,
      username: res.Username,
      email: getAttr(res.UserAttributes, 'email'),
      groups,
      isPaid: groups.includes(PAID_GROUP),
    };
  } catch (err) {
    console.error('AdminGetUser failed', username, err);
  }

  return ok({ action, username, user }, event);
};

exports.handler = async (event) => {
  try {
    if (!process.env.USER_POOL_ID) {
      return serverError('USER_POOL_ID is not configured', event);
    }

    const { errorResponse } = requireAdmin(event);
    if (errorResponse) return errorResponse;

    const method = event.httpMethod || event.requestContext?.http?.method;
    const path = event.path || event.rawPath || '';

    if (method === 'GET') return handleList(event);
    if (method === 'POST' && /\/grant$/.test(path)) return handleMutate(event, 'grant');
    if (method === 'POST' && /\/revoke$/.test(path)) return handleMutate(event, 'revoke');
    return badRequest('Unsupported method or path', event);
  } catch (error) {
    console.error('admin-users error', error);
    return serverError('Failed to process admin-users request', event);
  }
};
