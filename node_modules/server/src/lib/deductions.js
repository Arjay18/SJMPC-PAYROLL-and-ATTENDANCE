export function computeStatutoryDeductions({
  grossPay,
  breakdown = {},
}) {
  const sss = Number(breakdown.sss || 0)
  const philhealth = Number(breakdown.philhealth || 0)
  const pagibig = Number(breakdown.pagibig || 0)
  const tardiness = Number(breakdown.tardiness || 0)
  const shareCapital = Number(breakdown.shareCapital || 0)
  const ultimaA = Number(breakdown.ultimaA || 0)
  const alkansyaA = Number(breakdown.alkansyaA || 0)
  const savingsReg = Number(breakdown.savingsReg || 0)
  const employeesFund = Number(breakdown.employeesFund || 0)
  const regularLoans = Number(breakdown.regularLoans || 0)
  const others = Number(breakdown.others || 0)

  const totalDeductions = sss + philhealth + pagibig + tardiness + shareCapital + 
                          ultimaA + alkansyaA + savingsReg + employeesFund + 
                          regularLoans + others

  return {
    sss,
    philhealth,
    pagibig,
    tardiness,
    shareCapital,
    ultimaA,
    alkansyaA,
    savingsReg,
    employeesFund,
    regularLoans,
    others,
    totalDeductions,
  }
}
