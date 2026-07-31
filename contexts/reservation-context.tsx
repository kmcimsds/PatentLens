"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { currentUser } from "@/lib/equipment-data";
import {
  createInitialReservations,
  type Reservation,
  type ReservationModalMode,
  type ReservationModalState,
} from "@/lib/reservation-types";

interface OpenCreateModalParams {
  equipmentId: string;
  startTime?: Date;
  endTime?: Date;
  allowEquipmentSelect?: boolean;
}

interface ReservationContextValue {
  reservations: Reservation[];
  modalState: ReservationModalState;
  openCreateModal: (params: OpenCreateModalParams) => void;
  openDetailModal: (reservationId: string) => void;
  openEditModal: (reservationId: string) => void;
  closeModal: () => void;
  addReservation: (
    data: Omit<Reservation, "id" | "createdBy">
  ) => Reservation;
  updateReservation: (
    id: string,
    data: Omit<Reservation, "id" | "createdBy">
  ) => void;
  cancelReservation: (id: string) => void;
  isOwner: (reservation: Reservation) => boolean;
  getReservation: (id: string) => Reservation | undefined;
}

const ReservationContext = createContext<ReservationContextValue | null>(null);

const initialModalState: ReservationModalState = {
  open: false,
  mode: "create",
};

export function ReservationProvider({ children }: { children: ReactNode }) {
  const [reservations, setReservations] = useState<Reservation[]>(
    createInitialReservations
  );
  const [modalState, setModalState] =
    useState<ReservationModalState>(initialModalState);

  const isOwner = useCallback((reservation: Reservation) => {
    return reservation.createdBy === currentUser.displayName;
  }, []);

  const getReservation = useCallback(
    (id: string) => reservations.find((r) => r.id === id),
    [reservations]
  );

  const openCreateModal = useCallback(
    ({
      equipmentId,
      startTime,
      endTime,
      allowEquipmentSelect,
    }: OpenCreateModalParams) => {
      setModalState({
        open: true,
        mode: "create",
        equipmentId,
        defaultStart: startTime,
        defaultEnd: endTime,
        allowEquipmentSelect,
      });
    },
    []
  );

  const openDetailModal = useCallback((reservationId: string) => {
    setModalState({
      open: true,
      mode: "detail",
      reservationId,
    });
  }, []);

  const openEditModal = useCallback((reservationId: string) => {
    setModalState({
      open: true,
      mode: "edit",
      reservationId,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(initialModalState);
  }, []);

  const addReservation = useCallback(
    (data: Omit<Reservation, "id" | "createdBy">) => {
      const newReservation: Reservation = {
        ...data,
        id: `res-${Date.now()}`,
        createdBy: currentUser.displayName,
      };
      setReservations((prev) => [...prev, newReservation]);
      return newReservation;
    },
    []
  );

  const updateReservation = useCallback(
    (id: string, data: Omit<Reservation, "id" | "createdBy">) => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...data,
              }
            : r
        )
      );
    },
    []
  );

  const cancelReservation = useCallback((id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      reservations,
      modalState,
      openCreateModal,
      openDetailModal,
      openEditModal,
      closeModal,
      addReservation,
      updateReservation,
      cancelReservation,
      isOwner,
      getReservation,
    }),
    [
      reservations,
      modalState,
      openCreateModal,
      openDetailModal,
      openEditModal,
      closeModal,
      addReservation,
      updateReservation,
      cancelReservation,
      isOwner,
      getReservation,
    ]
  );

  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservations() {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error("useReservations must be used within ReservationProvider");
  }
  return context;
}
