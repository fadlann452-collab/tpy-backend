import API_BASE_URL from "./api";

export const getEvents = async (token) => {
  const response = await fetch(
    `${API_BASE_URL}/events`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};