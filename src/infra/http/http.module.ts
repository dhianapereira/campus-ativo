import { Module } from '@nestjs/common'
import { CreateAccountController } from './controllers/create-account.controller'
import { AuthenticateController } from './controllers/authenticate.controller'
import { LogoutController } from './controllers/logout.controller'
import { CreateProblemController } from './controllers/create-problem.controller'
import { FetchProblemsController } from './controllers/fetch-problems.controller'
import { DatabaseModule } from '../database/database.module'
import { CreateProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/create-problem'
import { FetchProblemsUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-problems'
import { RegisterUserUseCase } from '@/domain/accounts/application/use-cases/register-user'
import { AuthenticateUserUseCase } from '@/domain/accounts/application/use-cases/authenticate-user'
import { GetUserProfileUseCase } from '@/domain/accounts/application/use-cases/get-user-profile'
import { FetchUsersUseCase } from '@/domain/accounts/application/use-cases/fetch-users'
import { ChangeUserRoleUseCase } from '@/domain/accounts/application/use-cases/change-user-role'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { GetProblemBySlugUseCase } from '@/domain/maintenance-problems/application/use-cases/get-problem-by-slug'
import { GetProblemBySlugController } from './controllers/get-problem-by-slug.controller'
import { FetchCategoriesController } from './controllers/fetch-categories.controller'
import { FetchCategoriesUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-categories'
import { CreateCategoryController } from './controllers/create-category.controller'
import { CreateCategoryUseCase } from '@/domain/maintenance-problems/application/use-cases/create-category'
import { CreateLocationController } from './controllers/create-location.controller'
import { CreateLocationUseCase } from '@/domain/maintenance-problems/application/use-cases/create-location'
import { FetchLocationsUseCase } from '@/domain/maintenance-problems/application/use-cases/fetch-locations'
import { FetchLocationsController } from './controllers/fetch-locations.controller'
import { EditProblemController } from './controllers/edit-problem.controller'
import { EditProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/edit-problem'
import { DeleteProblemController } from './controllers/delete-problem.controller'
import { DeleteProblemUseCase } from '@/domain/maintenance-problems/application/use-cases/delete-problem'
import { TrashProblemController } from './controllers/trash-problem.controller'
import { MoveProblemToTrashUseCase } from '@/domain/maintenance-problems/application/use-cases/move-problem-to-trash'
import { RestoreProblemController } from './controllers/restore-problem.controller'
import { RestoreProblemFromTrashUseCase } from '@/domain/maintenance-problems/application/use-cases/restore-problem-from-trash'
import { GetUserProfileController } from './controllers/get-user-profile.controller'
import { FetchUsersController } from './controllers/fetch-users.controller'
import { ChangeUserRoleController } from './controllers/change-user-role.controller'
import { EditCategoryController } from './controllers/edit-category.controller'
import { EditCategoryUseCase } from '@/domain/maintenance-problems/application/use-cases/edit-category'
import { TrashCategoryController } from './controllers/trash-category.controller'
import { TrashCategoryUseCase } from '@/domain/maintenance-problems/application/use-cases/trash-category'
import { RestoreCategoryController } from './controllers/restore-category.controller'
import { RestoreCategoryUseCase } from '@/domain/maintenance-problems/application/use-cases/restore-category'
import { DeleteCategoryController } from './controllers/delete-category.controller'
import { DeleteCategoryUseCase } from '@/domain/maintenance-problems/application/use-cases/delete-category'
import { EditLocationController } from './controllers/edit-location.controller'
import { EditLocationUseCase } from '@/domain/maintenance-problems/application/use-cases/edit-location'
import { TrashLocationController } from './controllers/trash-location.controller'
import { TrashLocationUseCase } from '@/domain/maintenance-problems/application/use-cases/trash-location'
import { RestoreLocationController } from './controllers/restore-location.controller'
import { RestoreLocationUseCase } from '@/domain/maintenance-problems/application/use-cases/restore-location'
import { DeleteLocationController } from './controllers/delete-location.controller'
import { DeleteLocationUseCase } from '@/domain/maintenance-problems/application/use-cases/delete-location'
import { ChangeUserStatusController } from './controllers/change-user-status.controller'
import { ChangeUserStatusUseCase } from '@/domain/accounts/application/use-cases/change-user-status'
import { EditUserProfileController } from './controllers/edit-user-profile.controller'
import { EditUserProfileUseCase } from '@/domain/accounts/application/use-cases/edit-user-profile'
import { ChangeUserPasswordController } from './controllers/change-user-password.controller'
import { ChangeUserPasswordUseCase } from '@/domain/accounts/application/use-cases/change-user-password'
import { DeleteUserAccountController } from './controllers/delete-user-account.controller'
import { DeleteUserAccountUseCase } from '@/domain/accounts/application/use-cases/delete-user-account'
import { UploadAttachmentController } from './controllers/upload-attachment.controller'
import { UploadAttachmentUseCase } from '@/domain/maintenance-problems/application/use-cases/upload-attachment'
import { UploadModule } from '../upload/upload.module'
import { SyncGoogleSheetController } from './controllers/sync-google-sheet.controller'
import { SyncProblemsFromGoogleSheetUseCase } from '@/domain/maintenance-problems/application/use-cases/sync-problems-from-google-sheet'
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module'

@Module({
  imports: [
    DatabaseModule,
    CryptographyModule,
    UploadModule,
    GoogleSheetsModule,
  ],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    LogoutController,
    GetUserProfileController,
    FetchUsersController,
    ChangeUserRoleController,
    ChangeUserStatusController,
    EditUserProfileController,
    ChangeUserPasswordController,
    DeleteUserAccountController,
    CreateProblemController,
    FetchProblemsController,
    GetProblemBySlugController,
    FetchCategoriesController,
    CreateCategoryController,
    EditCategoryController,
    TrashCategoryController,
    RestoreCategoryController,
    DeleteCategoryController,
    CreateLocationController,
    FetchLocationsController,
    EditLocationController,
    TrashLocationController,
    RestoreLocationController,
    DeleteLocationController,
    EditProblemController,
    DeleteProblemController,
    TrashProblemController,
    RestoreProblemController,
    UploadAttachmentController,
    SyncGoogleSheetController,
  ],
  providers: [
    RegisterUserUseCase,
    AuthenticateUserUseCase,
    GetUserProfileUseCase,
    FetchUsersUseCase,
    ChangeUserRoleUseCase,
    ChangeUserStatusUseCase,
    EditUserProfileUseCase,
    ChangeUserPasswordUseCase,
    DeleteUserAccountUseCase,
    CreateProblemUseCase,
    FetchProblemsUseCase,
    GetProblemBySlugUseCase,
    FetchCategoriesUseCase,
    CreateCategoryUseCase,
    EditCategoryUseCase,
    TrashCategoryUseCase,
    RestoreCategoryUseCase,
    DeleteCategoryUseCase,
    CreateLocationUseCase,
    FetchLocationsUseCase,
    EditLocationUseCase,
    TrashLocationUseCase,
    RestoreLocationUseCase,
    DeleteLocationUseCase,
    EditProblemUseCase,
    DeleteProblemUseCase,
    MoveProblemToTrashUseCase,
    RestoreProblemFromTrashUseCase,
    UploadAttachmentUseCase,
    SyncProblemsFromGoogleSheetUseCase,
  ],
})
export class HttpModule {}
