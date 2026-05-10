interface SurveyTemplateParams {
  eventTitle: string;
}

export function generateSurveySubject(params: SurveyTemplateParams): string {
  return `【${params.eventTitle}】アンケートのお願い`;
}

export function generateSurveyBody(params: SurveyTemplateParams): string {
  const sections: string[] = [];

  sections.push("{CUSTOMER_NAME}様");
  sections.push(
    `この度は、${params.eventTitle}にご参加いただき、ありがとうございました。`
  );
  sections.push(
    "以下のURLよりアンケートにご回答いただけますと幸いです。\n{SURVEY_URL}"
  );
  sections.push("ご協力のほど、よろしくお願いいたします。");

  return sections.join("\n\n");
}
