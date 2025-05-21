"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus } from "lucide-react";
import { calculateTotalPrice } from "./utils";
import { ReservationFormData } from "@/components/reservation/types";

interface ReservationFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  availableMenus: { name: string; price: number; id: string }[];
  availableSeats: string[];
  availableTimes: string[];
  isLoading: boolean;
  onSubmit: (formData: ReservationFormData) => Promise<void>;
  formatDisplayDate: (date: string) => string;
}

export function ReservationFormModal({
  isOpen,
  onOpenChange,
  selectedDate,
  availableMenus,
  availableSeats,
  availableTimes,
  isLoading,
  onSubmit,
  formatDisplayDate,
}: ReservationFormModalProps) {
  const [formData, setFormData] = useState<ReservationFormData>({
    groupName: "",
    time: "12:00",
    seatNumber: "A-1",
    menuItems: [
      {
        name: availableMenus.length > 0 ? availableMenus[0].name : "",
        price: availableMenus.length > 0 ? availableMenus[0].price : 0,
        quantity: 1,
      },
    ],
  });

  const handleMenuItemChange = (
    index: number,
    field: "name" | "price" | "quantity",
    value: string | number,
  ) => {
    const newMenuItems = [...formData.menuItems];

    if (field === "name") {
      const selectedItem = availableMenus.find((item) => item.name === value);
      if (selectedItem) {
        newMenuItems[index] = {
          ...newMenuItems[index],
          name: value as string,
          price: selectedItem.price,
        };
      }
    } else if (field === "price" || field === "quantity") {
      newMenuItems[index][field] = value as number;
    }

    setFormData({
      ...formData,
      menuItems: newMenuItems,
    });
  };

  const addMenuItem = () => {
    if (availableMenus.length === 0) return;

    setFormData({
      ...formData,
      menuItems: [
        ...formData.menuItems,
        {
          name: availableMenus[0].name,
          price: availableMenus[0].price,
          quantity: 1,
        },
      ],
    });
  };

  const removeMenuItem = (index: number) => {
    if (formData.menuItems.length > 1) {
      const newMenuItems = [...formData.menuItems];
      newMenuItems.splice(index, 1);
      setFormData({
        ...formData,
        menuItems: newMenuItems,
      });
    }
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
    // 제출 후 폼 초기화
    setFormData({
      groupName: "",
      time: "12:00",
      seatNumber: "A-1",
      menuItems: [
        {
          name: availableMenus.length > 0 ? availableMenus[0].name : "",
          price: availableMenus.length > 0 ? availableMenus[0].price : 0,
          quantity: 1,
        },
      ],
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>새 예약 등록</DialogTitle>
          <DialogDescription>
            {formatDisplayDate(selectedDate)}에 새로운 예약을 등록합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="groupName">예약자명 / 단체명</Label>
            <Input
              id="groupName"
              value={formData.groupName}
              onChange={(e) =>
                setFormData({ ...formData, groupName: e.target.value })
              }
              placeholder="홍길동 / 홍씨 가족"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="time">예약 시간</Label>
              <Select
                value={formData.time}
                onValueChange={(value) =>
                  setFormData({ ...formData, time: value })
                }
              >
                <SelectTrigger id="time">
                  <SelectValue placeholder="시간 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seatNumber">예약석</Label>
              <Select
                value={formData.seatNumber}
                onValueChange={(value) =>
                  setFormData({ ...formData, seatNumber: value })
                }
              >
                <SelectTrigger id="seatNumber">
                  <SelectValue placeholder="좌석 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableSeats.map((seat) => (
                    <SelectItem key={seat} value={seat}>
                      {seat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>메뉴 선택</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMenuItem}
                disabled={availableMenus.length === 0}
              >
                <Plus className="h-4 w-4" /> 메뉴 추가
              </Button>
            </div>

            {formData.menuItems.map((item, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor={`menu-${index}`} className="sr-only">
                    메뉴
                  </Label>
                  <Select
                    value={item.name}
                    onValueChange={(value) =>
                      handleMenuItemChange(index, "name", value)
                    }
                  >
                    <SelectTrigger id={`menu-${index}`}>
                      <SelectValue placeholder="메뉴 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMenus.map((menuItem) => (
                        <SelectItem key={menuItem.id} value={menuItem.name}>
                          {menuItem.name} ({menuItem.price.toLocaleString()}
                          원)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-20">
                  <Label htmlFor={`quantity-${index}`} className="sr-only">
                    수량
                  </Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleMenuItemChange(
                        index,
                        "quantity",
                        parseInt(e.target.value) || 1,
                      )
                    }
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMenuItem(index)}
                  disabled={formData.menuItems.length <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="text-right font-semibold">
            총 가격:{" "}
            {calculateTotalPrice(
              formData.menuItems.map((item) => ({ ...item })),
            ).toLocaleString()}{" "}
            원
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "처리 중..." : "예약 등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
