export enum ReportType {
  INTELLECTUAL_PROPERTY_VIOLATION = "INTELLECTUAL_PROPERTY_VIOLATION",
  GENERATIVE_AI_CONTENT = "GENERATIVE_AI_CONTENT",
  CONTAINS_SEXUALLY_EXPLICIT_CONTENT = "CONTAINS_SEXUALLY_EXPLICIT_CONTENT",
  DECEPTIVE_OR_FRAUDULENT_CONTENT = "DECEPTIVE_OR_FRAUDULENT_CONTENT",
  CONTAINS_HATE_SPEECH = "CONTAINS_HATE_SPEECH",
  IS_SPAM = "IS_SPAM",
  CONTAINS_UNLAWFUL_CONTENT = "CONTAINS_UNLAWFUL_CONTENT",
}

export function getPrettyReportType(reportType: ReportType): string {
  switch(reportType){
    case ReportType.INTELLECTUAL_PROPERTY_VIOLATION:
      return `Violation of intellectual property rights`
    case ReportType.GENERATIVE_AI_CONTENT:
      return `Contains generative AI content`
    case ReportType.CONTAINS_SEXUALLY_EXPLICIT_CONTENT:
      return `Contains genitalia, breasts or depicts a sex act`
    case ReportType.DECEPTIVE_OR_FRAUDULENT_CONTENT:
      return `Deceptive or Fraudulent Content`
    case ReportType.CONTAINS_HATE_SPEECH:
      return `Contains hate speech`
    case ReportType.IS_SPAM:
      return `Is Spam`
    case ReportType.CONTAINS_UNLAWFUL_CONTENT:
      return `Contains unlawful content`
  }
}