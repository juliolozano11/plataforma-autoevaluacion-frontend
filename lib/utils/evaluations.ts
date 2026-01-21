import { Evaluation, Questionnaire, Section, SectionName } from '@/types';

type SectionLike = string | Section | null | undefined;
type QuestionnaireLike = string | Questionnaire | null | undefined;

export const getSectionId = (sectionId: SectionLike): string | null => {
  if (!sectionId) {
    return null;
  }
  if (typeof sectionId === 'object') {
    return sectionId?._id || null;
  }
  return sectionId;
};

export const resolveSection = (
  sections: Section[] | undefined,
  sectionId: SectionLike
): Section | undefined => {
  if (!sectionId) {
    return undefined;
  }

  if (typeof sectionId === 'object' && sectionId !== null) {
    const currentId = sectionId._id;
    if (!sections?.length) {
      return sectionId;
    }
    return sections.find((section) => String(section._id) === String(currentId));
  }

  return sections?.find((section) => String(section._id) === String(sectionId));
};

export const hasValidSection = (
  evaluation: { sectionId?: SectionLike },
  sections: Section[] | undefined
): boolean => Boolean(resolveSection(sections, evaluation.sectionId));

export const filterValidEvaluations = (
  evaluations: Evaluation[] | undefined,
  sections: Section[] | undefined
): Evaluation[] => {
  if (!sections?.length) {
    return [];
  }
  return evaluations?.filter((evaluation) =>
    hasValidSection(evaluation, sections)
  ) ?? [];
};

export const getSectionName = (
  sections: Section[] | undefined,
  sectionId: SectionLike,
  fallback = 'Sección'
): string => {
  const section = resolveSection(sections, sectionId);
  return section?.displayName || fallback;
};

export const getSectionTypeLabel = (
  sections: Section[] | undefined,
  sectionId: SectionLike
): string => {
  const section = resolveSection(sections, sectionId);
  if (!section) {
    return '';
  }
  switch (section.name) {
    case SectionName.BLANDAS:
      return 'Competencias Blandas';
    case SectionName.ADAPTATIVAS:
      return 'Competencias Adaptativas';
    case SectionName.TECNOLOGICAS:
      return 'Competencias Tecnológicas';
    default:
      return '';
  }
};

export const getQuestionnaireId = (
  questionnaireId: QuestionnaireLike
): string | null => {
  if (!questionnaireId) {
    return null;
  }
  if (typeof questionnaireId === 'object' && questionnaireId !== null) {
    return questionnaireId?._id || null;
  }
  return questionnaireId;
};

export const getQuestionnaire = (
  activeQuestionnaires: Questionnaire[] | undefined,
  evaluation: Partial<Evaluation> & {
    sectionId?: SectionLike;
    questionnaireId?: QuestionnaireLike;
  },
  sections?: Section[]
): Questionnaire | null => {
  if (evaluation.questionnaireId) {
    if (
      typeof evaluation.questionnaireId === 'object' &&
      evaluation.questionnaireId !== null
    ) {
      return evaluation.questionnaireId;
    }
    const questionnaire = activeQuestionnaires?.find(
      (q) => q._id === evaluation.questionnaireId
    );
    if (questionnaire) {
      return questionnaire;
    }
  }

  const sectionId = getSectionId(evaluation.sectionId);
  if (!sectionId) {
    return null;
  }

  return (
    activeQuestionnaires?.find((questionnaire) => {
      const questionnaireSectionId = getSectionId(questionnaire.sectionId);
      return (
        questionnaireSectionId &&
        String(questionnaireSectionId) === String(sectionId)
      );
    }) || null
  );
};

export const getQuestionnaireName = (
  evaluation: Partial<Evaluation> & {
    sectionId?: SectionLike;
    questionnaireId?: QuestionnaireLike;
  },
  sections: Section[] | undefined,
  activeQuestionnaires: Questionnaire[] | undefined
): string => {
  const sectionId = getSectionId(evaluation.sectionId);
  if (!sectionId) {
    return 'Evaluación no disponible';
  }

  const sectionExists = resolveSection(sections, sectionId);
  if (!sectionExists) {
    return 'Evaluación no disponible';
  }

  const questionnaire = getQuestionnaire(
    activeQuestionnaires,
    evaluation,
    sections
  );

  return questionnaire?.title || getSectionName(sections, evaluation.sectionId);
};

export const getEvaluationCompetence = (
  evaluation: Evaluation,
  sections: Section[] | undefined
): SectionName | null => {
  const section = resolveSection(sections, evaluation.sectionId);
  return section?.name || null;
};
