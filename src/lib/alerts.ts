import Swal from "sweetalert2";
import type { SweetAlertIcon } from "sweetalert2";

export const mostrarConfirmacion = async ({
  titulo = "¿Estás seguro?",
  texto = "Esta acción no se puede deshacer.",
  confirmText = "Sí, continuar",
  cancelText = "Cancelar",
  icono = "warning",
}: {
  titulo?: string;
  texto?: string;
  confirmText?: string;
  cancelText?: string;
  icono?: SweetAlertIcon;
}) => {
  return await Swal.fire({
    title: titulo,
    text: texto,
    icon: icono,
    background: "#2a2a2a",
    color: "#f1f1f1",
    iconColor: "#ff5c5c",
    showCancelButton: true,
    confirmButtonColor: "#ff5c5c",
    cancelButtonColor: "#555",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
      popup: "swal-dark-popup",
      title: "swal-title",
      confirmButton: "swal-confirm-btn",
      cancelButton: "swal-cancel-btn",
    },
  });
};

export const mostrarExito = async (mensaje = "Operación exitosa.") => {
  return await Swal.fire({
    title: "¡Éxito!",
    text: mensaje,
    icon: "success",
    background: "#2a2a2a",
    color: "#f1f1f1",
    confirmButtonColor: "#00d1b2",
    iconColor: "#00d1b2",
  });
};

export const mostrarError = async (mensaje = "Ocurrió un error.") => {
  return await Swal.fire({
    title: "Error",
    text: mensaje,
    icon: "error",
    background: "#2a2a2a",
    color: "#f1f1f1",
    confirmButtonColor: "#ff5c5c",
    iconColor: "#ff5c5c",
  });
};
