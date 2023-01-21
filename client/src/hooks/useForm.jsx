import React from "react";
import { useState } from "react";

export const useForm = (initialOBj = {}) => {
  const [form, setForm] = useState(initialOBj);

  const changed = ({ target }) => {
    const { name, value } = target;

    setForm({
      ...form,
      [name]: value,
    });
  };
  return { form, changed };
};
