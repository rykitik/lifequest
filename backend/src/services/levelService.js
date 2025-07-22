exports.addXP = async (user, xp) => {
  user.xp += xp;
  const nextLevelXP = user.level * 100;
  if (user.xp >= nextLevelXP) {
    user.level += 1;
    user.xp = user.xp - nextLevelXP;
  }
  await user.save();
};