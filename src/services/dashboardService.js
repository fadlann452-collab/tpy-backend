import API_BASE_URL from "./api";

export const getDashboardStats = async (token) => {
  const response = await fetch(
    `${API_BASE_URL}/dashboard`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};
