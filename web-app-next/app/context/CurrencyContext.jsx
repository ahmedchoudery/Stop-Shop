"use client";
import { createContext, useContext, useState } from 'react'

const CurrencyContext = createContext({ currency: 'PKR', setCurrency: () => {} })

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('PKR')
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)

export default CurrencyContext
