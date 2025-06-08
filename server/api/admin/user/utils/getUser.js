export default function getUser(body) {
  const {
    positionIndex,
    hidden,
    id,
    name,
    surname,
    accountNumber,
    email,
    phone,
    balance,
    mainBalance,
    accountStatus,
    country,
    city,
    address,
    password,
    docs,
    isActive,
    isVipStatus,
    blocked,
    isSwiftDepositAvailable, // Добавлено поле для пополнения баланса
  } = body;

  return {
    hidden,
    positionIndex,
    id,
    name,
    surname,
    balance,
    mainBalance,
    accountNumber,
    email,
    phone,
    accountStatus,
    country,
    city,
    address,
    password,
    docs,
    isActive,
    isVipStatus,
    blocked,
    isSwiftDepositAvailable, // Добавлено поле для пополнения баланса
  };
}
