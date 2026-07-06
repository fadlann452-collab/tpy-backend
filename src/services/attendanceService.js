import API_BASE_URL from "./api";

export const submitAttendance = async (
  data,
  token
) => {
  const response = await fetch(
    `${API_BASE_URL}/attendance`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  return response.json();
};